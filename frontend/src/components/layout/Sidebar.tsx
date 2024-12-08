import { MessageCircle, Users, PlaneTakeoff, Wrench, Code } from 'lucide-react'

const sections = [
  { id: 'general', name: 'General Discussion', icon: MessageCircle },
  { id: 'team', name: 'Team Management', icon: Users },
  { id: 'design', name: 'Design Team', icon: PlaneTakeoff },  // Changed from Drone
  { id: 'electronics', name: 'Electronics', icon: Wrench },   // Changed from Tool
  { id: 'software', name: 'Software Development', icon: Code } // Changed from Book
]

type SidebarProps = {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar = ({ currentSection, onSectionChange }: SidebarProps) => {
  return (
    <div className="w-64 bg-white shadow-lg h-full">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">GU Drones Forum</h1>
        <nav>
          {sections.map(section => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full flex items-center p-2 mb-2 rounded ${
                  currentSection === section.id 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                <span>{section.name}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
