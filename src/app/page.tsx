import { TodoApp } from "@/components/Todo";

export default function Home() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">Todo Application</h1>
          <p className="text-muted-foreground">
            A simple todo app built with Next.js and shadcn/ui
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col justify-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Features</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Create, toggle, and delete todos</li>
                <li>Persistent storage using localStorage</li>
                <li>Clean UI with shadcn/ui components</li>
                <li>Dark and light mode support</li>
                <li>Fully responsive design</li>
              </ul>
              
              <h2 className="text-2xl font-bold mt-6">Usage</h2>
              <p>
                Add new tasks using the input field. Toggle tasks by clicking the
                checkbox. Delete tasks with the delete button. Your tasks will be
                saved between sessions.
              </p>
            </div>
          </div>
          
          <div>
            <TodoApp />
          </div>
        </div>
      </div>
    </div>
  );
}
