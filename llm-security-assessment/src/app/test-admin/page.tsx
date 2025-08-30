export default function TestAdminPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Test Admin Page</h1>
        <p>If you can see this page, routing works correctly.</p>
        <p>Cookies: {typeof document !== 'undefined' ? document.cookie : 'N/A'}</p>
      </div>
    </div>
  );
}