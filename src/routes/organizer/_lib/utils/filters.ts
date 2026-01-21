import type { AppEvent } from '../stores/eventList';

export function filterEventsOptimized(
  events: AppEvent[],
  query: string,
  month: string,
  year: string
): AppEvent[] {
  if (!events || events.length === 0) return [];

  const lowerQuery = query.toLowerCase().trim();

  return events.filter((event) => {
    // Date filtering
    const eventDate = new Date(event.startDate);
    const eventYear = eventDate.getFullYear().toString();
    const eventMonth = (eventDate.getMonth() + 1).toString();

    if (year !== 'All' && eventYear !== year) return false;
    if (month !== 'All' && eventMonth !== month) return false;
    
    // Search query
    if (!lowerQuery) return true;

    return (
      event.title.toLowerCase().includes(lowerQuery) ||
      event.location.toLowerCase().includes(lowerQuery) ||
      event.description.toLowerCase().includes(lowerQuery)
    );
  });
}

export function sortEvents(
  events: AppEvent[],
  sortBy: 'date' | 'title' | 'participants',
  order: 'asc' | 'desc'
): AppEvent[] {
  const sorted = [...events].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'participants':
        comparison = a.participantCount - b.participantCount;
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

export function getUniqueYears(events: AppEvent[]): string[] {
  const years = new Set<string>();
  events.forEach(event => {
    const year = new Date(event.startDate).getFullYear().toString();
    years.add(year);
  });
  return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
}

export function getUniqueMonths(): { value: string; label: string }[] {
  return [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];
}