import { StockReservation } from '../common/interfaces/reservation.interface';

export const reservationsStore = new Map<string, StockReservation>();
export const productReservationsStore = new Map<string, Set<string>>();
