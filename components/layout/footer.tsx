export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-sm font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/features" className="hover:text-gray-900">Features</a></li>
              <li><a href="/pricing" className="hover:text-gray-900">Pricing</a></li>
              <li><a href="/api" className="hover:text-gray-900">API</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/about" className="hover:text-gray-900">About</a></li>
              <li><a href="/blog" className="hover:text-gray-900">Blog</a></li>
              <li><a href="/careers" className="hover:text-gray-900">Careers</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/docs" className="hover:text-gray-900">Documentation</a></li>
              <li><a href="/help" className="hover:text-gray-900">Help Center</a></li>
              <li><a href="/guides" className="hover:text-gray-900">Guides</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/privacy" className="hover:text-gray-900">Privacy</a></li>
              <li><a href="/terms" className="hover:text-gray-900">Terms</a></li>
              <li><a href="/cookies" className="hover:text-gray-900">Cookies</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-8 text-center text-sm text-gray-600">
          <p>&copy; 2024 ALX Polly. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}