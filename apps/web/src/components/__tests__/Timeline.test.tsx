import { render, screen, fireEvent } from '@testing-library/react';
import { Timeline } from '../Timeline';
import { Memory } from '@our-line-in-time/shared';

// Mock data
const mockMemories: Memory[] = [
  {
    id: '1',
    title: 'First Memory',
    narrative: 'This is my first memory',
    dateType: 'exact',
    startDate: new Date('2024-01-01'),
    location: { lat: 40.7128, lng: -74.0060 },
    locationName: 'New York City',
    privacyLevel: 'family',
    tags: ['test', 'memory'],
    familyMembers: ['user1'],
    mediaItems: [],
    createdBy: 'user1',
    lastModifiedBy: 'user1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    title: 'Second Memory',
    narrative: 'This is my second memory',
    dateType: 'exact',
    startDate: new Date('2024-02-01'),
    location: { lat: 34.0522, lng: -118.2437 },
    locationName: 'Los Angeles',
    privacyLevel: 'private',
    tags: ['vacation'],
    familyMembers: ['user1'],
    mediaItems: [
      {
        id: 'media1',
        memoryId: '2',
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024,
        storagePath: '/path/to/photo.jpg',
        extractedMetadata: {},
        uploadedBy: 'user1',
        processingStatus: 'complete',
        createdAt: new Date('2024-02-01'),
      }
    ],
    createdBy: 'user1',
    lastModifiedBy: 'user1',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];

describe('Timeline Component', () => {
  it('renders empty state when no memories', () => {
    render(<Timeline memories={[]} />);

    expect(screen.getByText('No memories yet')).toBeInTheDocument();
    expect(screen.getByText('Start by creating your first memory to see your timeline.')).toBeInTheDocument();
  });

  it('renders memories correctly', () => {
    render(<Timeline memories={mockMemories} />);

    expect(screen.getByText('First Memory')).toBeInTheDocument();
    expect(screen.getByText('Second Memory')).toBeInTheDocument();
    expect(screen.getByText('New York City')).toBeInTheDocument();
    expect(screen.getByText('Los Angeles')).toBeInTheDocument();
  });

  it('shows correct memory count', () => {
    render(<Timeline memories={mockMemories} />);

    expect(screen.getByText('2 of 2 memories')).toBeInTheDocument();
  });

  it('filters memories by search term', () => {
    render(<Timeline memories={mockMemories} />);

    const searchInput = screen.getByPlaceholderText('Search memories...');
    fireEvent.change(searchInput, { target: { value: 'first' } });

    expect(screen.getByText('First Memory')).toBeInTheDocument();
    expect(screen.queryByText('Second Memory')).not.toBeInTheDocument();
    expect(screen.getByText('1 of 2 memories')).toBeInTheDocument();
  });

  it('filters memories by photos', () => {
    render(<Timeline memories={mockMemories} />);

    const filterSelect = screen.getByDisplayValue('All memories');
    fireEvent.change(filterSelect, { target: { value: 'photos' } });

    expect(screen.queryByText('First Memory')).not.toBeInTheDocument();
    expect(screen.getByText('Second Memory')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 memories')).toBeInTheDocument();
  });

  it('sorts memories by date', () => {
    render(<Timeline memories={mockMemories} />);

    const sortSelect = screen.getByDisplayValue('Newest first');
    fireEvent.change(sortSelect, { target: { value: 'oldest' } });

    // Check that memories are reordered (First Memory from Jan should come before Second Memory from Feb)
    const memoryTitles = screen.getAllByRole('heading', { level: 4 });
    expect(memoryTitles[0]).toHaveTextContent('First Memory');
    expect(memoryTitles[1]).toHaveTextContent('Second Memory');
  });

  it('calls onMemoryClick when memory is clicked', () => {
    const mockOnClick = jest.fn();
    render(<Timeline memories={mockMemories} onMemoryClick={mockOnClick} />);

    const firstMemory = screen.getByText('First Memory').closest('[data-testid="memory-card"]') ||
                       screen.getByText('First Memory').closest('div');

    if (firstMemory) {
      fireEvent.click(firstMemory);
      expect(mockOnClick).toHaveBeenCalledWith(mockMemories[0]);
    }
  });

  it('displays privacy indicators', () => {
    render(<Timeline memories={mockMemories} />);

    // Check for privacy level indicators (visual elements)
    const privacyIndicators = screen.getAllByTitle(/Public|Family|Private/);
    expect(privacyIndicators).toHaveLength(2);
  });

  it('shows media count for memories with media', () => {
    render(<Timeline memories={mockMemories} />);

    // Second memory has 1 media item
    expect(screen.getByText('1')).toBeInTheDocument(); // Media count
  });

  it('groups memories correctly by month', () => {
    render(<Timeline memories={mockMemories} />);

    expect(screen.getByText('February 2024')).toBeInTheDocument();
    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('shows no results message when search yields no results', () => {
    render(<Timeline memories={mockMemories} />);

    const searchInput = screen.getByPlaceholderText('Search memories...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No memories found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filter criteria.')).toBeInTheDocument();
  });
});