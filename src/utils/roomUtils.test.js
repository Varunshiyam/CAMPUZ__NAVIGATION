import { describe, it, expect } from 'vitest';
import {
    getFloorName,
    getRoomTypeColor,
    groupRoomsByFloor,
    formatRoomLocation,
    getRoomTypeDisplayName,
    sortRooms
} from './roomUtils';

describe('roomUtils', () => {
    describe('getFloorName', () => {
        it('converts floor number to human-readable string', () => {
            expect(getFloorName(0)).toBe('Ground Floor');
            expect(getFloorName(1)).toBe('First Floor');
            expect(getFloorName(2)).toBe('Second Floor');
            expect(getFloorName(3)).toBe('Third Floor');
            expect(getFloorName(4)).toBe('Fourth Floor');
            expect(getFloorName(5)).toBe('Fifth Floor');
            expect(getFloorName(6)).toBe('Floor 6');
        });
    });

    describe('getRoomTypeColor', () => {
        it('returns correct color scheme and icon for known room types', () => {
            const labColors = getRoomTypeColor('lab');
            expect(labColors.icon).toBe('🧪');
            expect(labColors.primary).toBe('#3B82F6');

            const classroomColors = getRoomTypeColor('classroom');
            expect(classroomColors.icon).toBe('📚');

            const defaultColors = getRoomTypeColor('unknown');
            expect(defaultColors.icon).toBe('📍');
        });
    });

    describe('groupRoomsByFloor', () => {
        it('groups rooms by floor number', () => {
            const rooms = [
                { id: '101', floor: 1 },
                { id: '201', floor: 2 },
                { id: '102', floor: 1 },
                { id: '001', floor: 0 }
            ];
            const grouped = groupRoomsByFloor(rooms);
            expect(grouped[0]).toHaveLength(1);
            expect(grouped[1]).toHaveLength(2);
            expect(grouped[2]).toHaveLength(1);
        });

        it('defaults floor to 0 if not specified', () => {
            const rooms = [
                { id: '101' }
            ];
            const grouped = groupRoomsByFloor(rooms);
            expect(grouped[0]).toHaveLength(1);
        });
    });

    describe('formatRoomLocation', () => {
        it('formats room location with building name and floor', () => {
            const locationData = {
                'ABlock': { name: 'A Block' }
            };
            const room = { parentBuilding: 'ABlock', floor: 1 };
            expect(formatRoomLocation(room, locationData)).toBe('A Block - First Floor');
        });

        it('uses building ID if building name not found in locationData', () => {
            const room = { parentBuilding: 'UnknownBlock', floor: 2 };
            expect(formatRoomLocation(room, {})).toBe('UnknownBlock - Second Floor');
        });

        it('returns empty string if room has no parentBuilding', () => {
            const room = { floor: 1 };
            expect(formatRoomLocation(room, {})).toBe('');
        });
    });

    describe('getRoomTypeDisplayName', () => {
        it('returns correct display name for room types', () => {
            expect(getRoomTypeDisplayName('lab')).toBe('Laboratory');
            expect(getRoomTypeDisplayName('classroom')).toBe('Classroom');
            expect(getRoomTypeDisplayName('unknown')).toBe('unknown');
        });
    });

    describe('sortRooms', () => {
        it('sorts rooms by floor and then by room ID', () => {
            const rooms = [
                { id: '202', floor: 2 },
                { id: '102', floor: 1 },
                { id: '101', floor: 1 },
                { id: '001', floor: 0 }
            ];
            const sorted = sortRooms(rooms);
            expect(sorted[0].id).toBe('001');
            expect(sorted[1].id).toBe('101');
            expect(sorted[2].id).toBe('102');
            expect(sorted[3].id).toBe('202');
        });
    });
});
