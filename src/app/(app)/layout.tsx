export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 pb-32 pt-32 sm:px-10 sm:pt-40">
      {children}
    </main>
  );
}
