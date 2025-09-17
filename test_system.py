#!/usr/bin/env python3
"""
GentleReader System Test Script
Tests all components to see what's working
"""

import asyncio
import httpx
import json
import os
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

# Load backend and frontend env files so os.getenv can see them
# (this file lives in .../gentle-reader/web/)
here = Path(__file__).resolve().parent          # .../gentle-reader/web
repo_root = here.parent                         # .../gentle-reader
load_dotenv(repo_root / "api" / ".env", override=True)
load_dotenv(here / ".env.local", override=True)

# Configuration
API_BASE = "http://localhost:8000"
FRONTEND_BASE = "http://localhost:5173"

# Test URLs for the checker
TEST_URLS = [
    "https://www.cdc.gov/flu/index.htm",  # Should be safe
    "https://www.webmd.com",              # Should be safe
    "https://example.com",                # Should be neutral
    "https://naturalnews.com",            # Should trigger warnings
]

class TestRunner:
    def __init__(self):
        self.results = {}
        self.client = None
    
    async def __aenter__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()

    async def test_backend_health(self):
        """Test if backend is running and healthy"""
        try:
            response = await self.client.get(f"{API_BASE}/health")
            self.results["backend_health"] = {
                "status": "✅ PASS" if response.status_code == 200 else "❌ FAIL",
                "status_code": response.status_code,
                "response": response.json() if response.status_code == 200 else str(response.text)
            }
        except Exception as e:
            self.results["backend_health"] = {
                "status": "❌ FAIL",
                "error": str(e)
            }

    async def test_frontend_reachable(self):
        """Test if frontend is running"""
        try:
            response = await self.client.get(FRONTEND_BASE)
            self.results["frontend_reachable"] = {
                "status": "✅ PASS" if response.status_code == 200 else "❌ FAIL",
                "status_code": response.status_code
            }
        except Exception as e:
            self.results["frontend_reachable"] = {
                "status": "❌ FAIL",
                "error": str(e)
            }

    async def test_url_checker_endpoint(self):
        """Test the main URL checking functionality"""
        try:
            test_payload = {"url": "https://www.cdc.gov"}
            response = await self.client.post(
                f"{API_BASE}/api/check",
                json=test_payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["verdict", "reasons", "summary", "meta"]
                has_all_fields = all(field in data for field in required_fields)
                
                self.results["url_checker"] = {
                    "status": "✅ PASS" if has_all_fields else "⚠️ PARTIAL",
                    "response": data,
                    "has_required_fields": has_all_fields,
                    "missing_fields": [f for f in required_fields if f not in data]
                }
            else:
                self.results["url_checker"] = {
                    "status": "❌ FAIL",
                    "status_code": response.status_code,
                    "error": response.text
                }
        except Exception as e:
            self.results["url_checker"] = {
                "status": "❌ FAIL",
                "error": str(e)
            }

    async def test_multiple_urls(self):
        """Test checker with multiple URLs to see detection variety"""
        results = []
        for url in TEST_URLS:
            try:
                response = await self.client.post(
                    f"{API_BASE}/api/check",
                    json={"url": url},
                    headers={"Content-Type": "application/json"}
                )
                if response.status_code == 200:
                    data = response.json()
                    results.append({
                        "url": url,
                        "verdict": data.get("verdict"),
                        "reasons": data.get("reasons", []),
                        "summary_length": len(data.get("summary", ""))
                    })
                else:
                    results.append({
                        "url": url,
                        "error": f"Status {response.status_code}"
                    })
            except Exception as e:
                results.append({
                    "url": url,
                    "error": str(e)
                })
        
        # Analyze results
        successful_checks = [r for r in results if "verdict" in r]
        unique_verdicts = set(r["verdict"] for r in successful_checks)
        
        self.results["multiple_url_test"] = {
            "status": "✅ PASS" if len(successful_checks) >= 2 else "❌ FAIL",
            "total_tested": len(TEST_URLS),
            "successful": len(successful_checks),
            "unique_verdicts": list(unique_verdicts),
            "results": results
        }

    async def test_auth_endpoints(self):
        """Test authentication-related endpoints"""
        try:
            # Test without auth
            response = await self.client.post(
                f"{API_BASE}/api/check",
                json={"url": "https://example.com"}
            )
            
            auth_working = response.status_code in [200, 401]  # Either works or requires auth
            
            self.results["auth_system"] = {
                "status": "✅ DETECTED" if auth_working else "❌ ERROR",
                "note": "Auth system appears to be configured",
                "status_code": response.status_code
            }
        except Exception as e:
            self.results["auth_system"] = {
                "status": "❌ FAIL",
                "error": str(e)
            }

    def test_environment_variables(self):
        """Check if required environment variables are set"""
        required_vars = [
            "OPENAI_API_KEY",
            "SUPABASE_URL", 
            "STRIPE_SECRET_KEY",
            "VITE_SUPABASE_URL",
            "VITE_API_URL"
        ]
        
        env_status = {}
        for var in required_vars:
            value = os.getenv(var)
            env_status[var] = {
                "set": value is not None,
                "length": len(value) if value else 0,
                "preview": value[:10] + "..." if value and len(value) > 10 else value
            }
        
        vars_set = sum(1 for status in env_status.values() if status["set"])
        
        self.results["environment_variables"] = {
            "status": "✅ PASS" if vars_set >= 3 else "⚠️ PARTIAL" if vars_set > 0 else "❌ FAIL",
            "variables_set": f"{vars_set}/{len(required_vars)}",
            "details": env_status
        }

    async def test_database_connection(self):
        """Test database connectivity (indirect via API)"""
        try:
            # Try to make a request that would hit the database
            response = await self.client.post(
                f"{API_BASE}/api/check",
                json={"url": "https://example.com"}
            )
            
            # If we get any structured response, DB is probably working
            db_working = response.status_code in [200, 401, 422]
            
            self.results["database"] = {
                "status": "✅ LIKELY WORKING" if db_working else "❌ POSSIBLE ISSUE",
                "note": "Indirect test via API response",
                "status_code": response.status_code
            }
        except Exception as e:
            self.results["database"] = {
                "status": "❌ FAIL",
                "error": str(e)
            }

    def print_results(self):
        """Print formatted test results"""
        print("🔍 GentleReader System Test Results")
        print("=" * 50)
        print(f"Test run: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        for test_name, result in self.results.items():
            print(f"📋 {test_name.replace('_', ' ').title()}")
            print(f"   Status: {result['status']}")
            
            if "error" in result:
                print(f"   Error: {result['error']}")
            elif "note" in result:
                print(f"   Note: {result['note']}")
            
            # Show additional details for some tests
            if test_name == "url_checker" and result["status"] == "✅ PASS":
                print(f"   Verdict: {result['response'].get('verdict', 'N/A')}")
                print(f"   Reasons: {len(result['response'].get('reasons', []))}")
            
            if test_name == "multiple_url_test" and "successful" in result:
                print(f"   Success rate: {result['successful']}/{result['total_tested']}")
                print(f"   Verdicts found: {', '.join(result['unique_verdicts'])}")
            
            if test_name == "environment_variables":
                print(f"   Variables: {result['variables_set']}")
            
            print()
        
        # Overall assessment
        passed_tests = sum(1 for r in self.results.values() if r["status"].startswith("✅"))
        total_tests = len(self.results)
        
        print("🎯 Overall Assessment")
        print(f"   Tests passed: {passed_tests}/{total_tests}")
        
        if passed_tests == total_tests:
            print("   🚀 System appears fully functional!")
        elif passed_tests >= total_tests * 0.7:
            print("   ⚡ System mostly working, minor issues to fix")
        else:
            print("   🔧 Several components need attention")

async def main():
    print("Starting GentleReader system test...")
    print("Make sure both frontend (npm run dev) and backend (uvicorn app.main:app --reload) are running!")
    print()
    
    async with TestRunner() as tester:
        # Run all tests
        await tester.test_backend_health()
        await tester.test_frontend_reachable()
        await tester.test_url_checker_endpoint()
        await tester.test_multiple_urls()
        await tester.test_auth_endpoints()
        await tester.test_database_connection()
        tester.test_environment_variables()
        
        # Print results
        tester.print_results()

if __name__ == "__main__":
    asyncio.run(main())
