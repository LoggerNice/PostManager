import { IUser } from '@/types/user.types';

interface TimelineTabProps {
  users: IUser[];
}

export default function TimelineTab({ users }: TimelineTabProps) {
  return (
    <div className="px-8 py-8">
      <div className="bg-gray-800 rounded-xl p-6 shadow border border-gray-800">
        <div className="text-gray-400 text-xs mb-4">February 2023</div>
        {/* Timeline grid */}
        <div className="relative">
          {/* Dates row */}
          <div className="flex text-xs text-gray-500 mb-2">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="w-12 text-center">{13 + i}</div>
            ))}
          </div>
          {/* Tasks */}
          <div className="space-y-3">
            {/* Example task 1 */}
            <div className="flex items-center h-8 relative">
              <div className="absolute left-[0%] w-[40%] h-full bg-[#313442] rounded-md flex items-center px-3">
                <span className="mr-2 text-blue-400">📄</span>
                <span className="text-sm">Shopify research process</span>
                <span className="ml-3 text-xs text-gray-400 flex items-center gap-1"><span>7</span> <span>•</span> <span>6/16</span></span>
                <div className="flex ml-3 -space-x-2">
                  {users.slice(0,3).map(u => (
                    <div key={u.id} className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#23262F] text-xs">{u.name.charAt(0).toUpperCase()}</div>
                  ))}
                </div>
              </div>
            </div>
            {/* Example task 2 */}
            <div className="flex items-center h-8 relative">
              <div className="absolute left-[10%] w-[35%] h-full bg-[#2E4D3D] rounded-md flex items-center px-3">
                <span className="mr-2 text-green-400">🖥️</span>
                <span className="text-sm">Low fidelity landing page</span>
                <span className="ml-3 text-xs text-gray-400 flex items-center gap-1"><span>4</span> <span>•</span> <span>12/14</span></span>
                <div className="flex ml-3 -space-x-2">
                  {users.slice(0,2).map(u => (
                    <div key={u.id} className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#23262F] text-xs">{u.name.charAt(0).toUpperCase()}</div>
                  ))}
                </div>
              </div>
            </div>
            {/* Example task 3 */}
            <div className="flex items-center h-8 relative">
              <div className="absolute left-[25%] w-[30%] h-full bg-[#313442] rounded-md flex items-center px-3">
                <span className="mr-2 text-blue-400">📄</span>
                <span className="text-sm">High fidelity landing page</span>
                <span className="ml-3 text-xs text-gray-400 flex items-center gap-1"><span>5</span> <span>•</span> <span>9/12</span></span>
                <div className="flex ml-3 -space-x-2">
                  {users.slice(0,2).map(u => (
                    <div key={u.id} className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#23262F] text-xs">{u.name.charAt(0).toUpperCase()}</div>
                  ))}
                </div>
              </div>
            </div>
            {/* Example task 4 */}
            <div className="flex items-center h-8 relative">
              <div className="absolute left-[40%] w-[25%] h-full bg-[#4D3B2E] rounded-md flex items-center px-3">
                <span className="mr-2 text-yellow-400">🛠️</span>
                <span className="text-sm">Development</span>
                <span className="ml-3 text-xs text-gray-400 flex items-center gap-1"><span>3</span> <span>•</span> <span>2/6</span></span>
                <div className="flex ml-3 -space-x-2">
                  {users.slice(0,2).map(u => (
                    <div key={u.id} className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#23262F] text-xs">{u.name.charAt(0).toUpperCase()}</div>
                  ))}
                </div>
              </div>
            </div>
            {/* Example task 5 */}
            <div className="flex items-center h-8 relative">
              <div className="absolute left-[0%] w-[60%] h-full bg-[#4D432E] rounded-md flex items-center px-3">
                <span className="mr-2 text-yellow-400">📐</span>
                <span className="text-sm">Shopify design system</span>
                <span className="ml-3 text-xs text-gray-400 flex items-center gap-1"><span>11</span> <span>•</span> <span>12/18</span></span>
                <div className="flex ml-3 -space-x-2">
                  {users.slice(0,2).map(u => (
                    <div key={u.id} className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#23262F] text-xs">{u.name.charAt(0).toUpperCase()}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Vertical blue line for today (21st) */}
          <div className="absolute top-0 left-[48%] w-0.5 h-full bg-blue-500 z-10" style={{height: 'calc(100% - 8px)'}}></div>
          {/* Today marker */}
          <div className="absolute left-[48%] -top-6 w-8 flex flex-col items-center">
            <div className="bg-blue-500 text-white text-xs rounded px-2 py-0.5">21 T</div>
          </div>
        </div>
      </div>
    </div>
  );
} 