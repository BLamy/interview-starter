export function Footer() {
  return (
    <footer className="w-full border-t py-6 md:py-0">
      <div className="container flex flex-col md:flex-row items-center justify-center md:justify-between md:h-16 gap-4">
        <p className="text-sm text-muted-foreground">
          Built with Next.js, Tailwind CSS, and shadcn/ui
        </p>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Todo App
        </p>
      </div>
    </footer>
  )
} 