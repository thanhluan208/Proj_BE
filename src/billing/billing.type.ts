import { ContractEntity } from 'src/contracts/contract.entity';
import { RoomEntity } from 'src/rooms/room.entity';
import { TenantEntity } from 'src/tenant/tenant.entity';

export interface HouseInfo {
  houseAddress?: string;
  houseOwner?: string;
  houseOwnerPhoneNumber?: string;
  houseOwnerBackupPhoneNumber?: string;
}

export type Item = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type UltilityDetail = {
  electric_start_index?: number;
  electric_end_index?: number;
  electric_price_unit?: number;
  water_start_index?: number;
  water_end_index?: number;
  water_price_unit?: number;
};

export interface GenerateBillingExcelData {
  contract: ContractEntity;
  tenant: TenantEntity;
  room: RoomEntity;
  from: Date;
  to: Date;
  items: Item[];
  utilityDetails: UltilityDetail | null;
  notes: string;
  totalAmount: number;
}
