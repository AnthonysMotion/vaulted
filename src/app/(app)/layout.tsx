export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
      {children}
    </main>
  );
}
