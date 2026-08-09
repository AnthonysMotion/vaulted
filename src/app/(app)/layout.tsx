export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-16 pt-8 sm:px-8 sm:pb-20 sm:pt-10 md:px-10">
      {children}
    </main>
  );
}
