export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-28 pt-6 sm:px-8 sm:pb-32 sm:pt-8 md:px-10 md:pb-32 md:pt-36">
      {children}
    </main>
  );
}
