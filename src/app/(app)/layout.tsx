export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 pb-36 pt-24 sm:px-8 sm:pt-32 md:px-10 md:pb-32 md:pt-40">
      {children}
    </main>
  );
}
