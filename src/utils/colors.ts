export const getColorClasses = (colorName?: string | null) => {
  switch (colorName) {
    case 'red': return 'bg-red-100 text-red-700 border-red-200';
    case 'yellow': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'green': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'blue': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'purple': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'pink': return 'bg-pink-100 text-pink-700 border-pink-200';
    default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  }
};
