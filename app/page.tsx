type Phone = {
  id: number;
  name: string;
  manufacturer: string | null;
  storage: string | null;
  camera: string | null;
  battery: string | null;
};

export default async function Home() {
  const response = await fetch("http://localhost:3000/api/phones", {
    cache: "no-store",
  });

  if (!response.ok) {
    return <main>Failed to load phones.</main>;
  }

  const result = await response.json();
  const phones: Phone[] = result.phones;

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">PhoneHub</h1>

      <p className="mt-2 text-gray-600">Explore our available smartphones</p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {phones.map((phone) => (
          <div key={phone.id} className="rounded-xl border p-5 shadow-sm">
            <h2 className="text-xl font-semibold">{phone.name}</h2>

            <p>Brand: {phone.manufacturer}</p>
            <p>Storage: {phone.storage}</p>
            <p>Camera: {phone.camera}</p>
            <p>Battery: {phone.battery}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
