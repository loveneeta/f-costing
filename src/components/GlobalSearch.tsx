import React, { useState, useEffect, useRef } from 'react';
import { Search, FolderOpen, Copy } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Project } from '../types';

interface GlobalSearchProps {
  onEdit?: (p: Project) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onEdit }) => {
  const { projects } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (p: Project) => {
    if (onEdit) {
      onEdit(p);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredProjects = searchTerm.length > 0 
    ? projects.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 8)
    : [];

  return (
    <div ref={wrapperRef} className="relative hidden sm:flex items-center flex-1 max-w-[200px] md:max-w-[240px] lg:max-w-xs ml-2 md:ml-4">
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-neutral-400" />
        </div>
        <input
          type="text"
          className="w-full pl-9 pr-4 py-1.5 bg-neutral-100/80 border border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-500 transition-all outline-none"
          placeholder="Search projects & categories..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (searchTerm.length > 0) setIsOpen(true);
          }}
        />
      </div>

      {isOpen && searchTerm.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto">
          {filteredProjects.length > 0 ? (
            <ul className="py-1">
              {filteredProjects.map((project) => (
                <li key={project.id}>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-neutral-50 flex flex-col items-start focus:bg-neutral-50 focus:outline-none"
                    onClick={() => handleSelect(project)}
                  >
                    <div className="flex items-center gap-2">
                      {project.isTemplate ? (
                        <Copy size={14} className="text-blue-500 shrink-0" />
                      ) : (
                        <FolderOpen size={14} className="text-neutral-500 shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-neutral-900 truncate">
                        {project.name}
                      </span>
                    </div>
                    {project.category && (
                      <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider ml-5 mt-0.5">
                        {project.category}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-neutral-500">
              No projects found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
