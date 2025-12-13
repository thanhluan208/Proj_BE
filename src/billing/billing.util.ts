import { I18nContext, I18nService } from 'nestjs-i18n';
import * as ExcelJS from 'exceljs';
import { CreateBillingDto } from './dto/create-billing.dto';
import { ContractEntity } from 'src/contracts/contract.entity';
import { TenantEntity } from 'src/tenant/tenant.entity';
import dayjs from 'dayjs';
import { RoomEntity } from 'src/rooms/room.entity';

type Item = {
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

interface GenerateBillingExcelData {
  contract: ContractEntity;
  tenant: TenantEntity;
  room: RoomEntity;
  from: Date;
  to: Date;
  bankInfo: CreateBillingDto['bankInfo'];
  houseInfo: CreateBillingDto['houseInfo'];
  items: Item[];
  utilityDetails: UltilityDetail | null;
  notes: string;
  totalAmount: number;
}

const hasUtilityMeterReadings = (
  utilityDetails: UltilityDetail | null,
): boolean => {
  if (!utilityDetails) return false;

  const hasElectricMeters =
    utilityDetails.electric_start_index !== undefined &&
    utilityDetails.electric_end_index !== undefined &&
    utilityDetails.electric_price_unit !== undefined;

  const hasWaterMeters =
    utilityDetails.water_start_index !== undefined &&
    utilityDetails.water_end_index !== undefined &&
    utilityDetails.water_price_unit !== undefined;

  return hasElectricMeters || hasWaterMeters;
};

export const generateBillingExcel = async (
  data: GenerateBillingExcelData,
  i18nService: I18nService,
): Promise<Buffer> => {
  const lang = I18nContext.current()?.lang;

  const { bankInfo, houseInfo, totalAmount, room, tenant, utilityDetails } =
    data;

  const invoiceTitle = i18nService.t('billing.invoiceTitle', { lang });
  const fromLandlord = i18nService.t('billing.fromLandlord', { lang });
  const invoiceDetailsTitle = i18nService.t('billing.invoiceDetails', {
    lang,
  });
  const billToTenant = i18nService.t('billing.billToTenant', { lang });

  const noLabel = i18nService.t('billing.table.no', { lang });
  const descriptionLabel = i18nService.t('billing.table.description', {
    lang,
  });
  const quantityLabel = i18nService.t('billing.table.quantity', {
    lang,
  });
  const unitPriceLabel = i18nService.t('billing.table.unitPrice', {
    lang,
  });
  const amountLabel = i18nService.t('billing.table.amount', { lang });

  const utilityTitle = i18nService.t('billing.utility.title', { lang });
  const indexLabel = i18nService.t('billing.utility.index', { lang });
  const contentLabel = i18nService.t('billing.utility.content', {
    lang,
  });
  const clockIndexLabel = i18nService.t('billing.utility.clockIndex', {
    lang,
  });
  const usageAmountLabel = i18nService.t('billing.utility.usageAmount', {
    lang,
  });
  const pricePerUnitLabel = i18nService.t('billing.utility.pricePerUnit', {
    lang,
  });
  const totalLabel = i18nService.t('billing.utility.total', { lang });
  const electricLabel = i18nService.t('billing.utility.electric', {
    lang,
  });
  const waterLabel = i18nService.t('billing.utility.water', { lang });
  const startLabel = i18nService.t('billing.utility.start', { lang });
  const endLabel = i18nService.t('billing.utility.end', { lang });

  const subtotalLabel = i18nService.t('billing.summary.subtotal', {
    lang,
  });
  const previousBalanceLabel = i18nService.t(
    'billing.summary.previousBalance',
    { lang },
  );
  const totalAmountDueLabel = i18nService.t('billing.summary.totalAmountDue', {
    lang,
  });

  const notesLabel = i18nService.t('billing.notes', { lang });
  const thankYouText = i18nService.t('billing.footer.thankYou', {
    lang,
  });
  const paymentReminderText = i18nService.t('billing.footer.paymentReminder', {
    lang,
  });

  const nameLabel = i18nService.t('billing.landlord.name', { lang });
  const addressLabel = i18nService.t('billing.landlord.address', {
    lang,
  });
  const phoneLabel = i18nService.t('billing.landlord.phone', { lang });
  const bankAccountLabel = i18nService.t('billing.landlord.bankAccount', {
    lang,
  });

  const invoiceNoLabel = i18nService.t('billing.details.invoiceNo', {
    lang,
  });
  const invoiceDateLabel = i18nService.t('billing.details.invoiceDate', {
    lang,
  });
  const dueDateLabel = i18nService.t('billing.details.dueDate', {
    lang,
  });
  const billingPeriodLabel = i18nService.t('billing.details.billingPeriod', {
    lang,
  });

  const tenantNameLabel = i18nService.t('billing.tenant.name', { lang });
  const roomNumberLabel = i18nService.t('billing.tenant.roomNumber', {
    lang,
  });
  const phoneNumberLabel = i18nService.t('billing.tenant.phone', {
    lang,
  });
  const idNumberLabel = i18nService.t('billing.tenant.idNumber', {
    lang,
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Invoice', {
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToHeight: 1,
      fitToWidth: 1,
    },
  });

  worksheet.columns = [10, 25, 15, 12, 15, 18].map((width) => ({
    width,
    alignment: { wrapText: true },
  }));

  let currentRow = 1;

  // ========== HEADER SECTION ==========
  //   worksheet.mergeCells(`A${currentRow}:B${currentRow + 2}`);
  //   const logoCell = worksheet.getCell(`A${currentRow}`);
  //   logoCell.value = 'LOGO';
  //   logoCell.font = { size: 20, bold: true, color: { argb: 'FF4472C4' } };
  //   logoCell.alignment = { vertical: 'middle', horizontal: 'center' };
  //   logoCell.fill = {
  //     type: 'pattern',
  //     pattern: 'solid',
  //     fgColor: { argb: 'FFE7F0FF' },
  //   };
  //   logoCell.border = {
  //     top: { style: 'thin' },
  //     left: { style: 'thin' },
  //     bottom: { style: 'thin' },
  //     right: { style: 'thin' },
  //   };

  worksheet.mergeCells(`A${currentRow}:F${currentRow + 2}`);
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = invoiceTitle;
  titleCell.font = { size: 24, bold: true, color: { argb: 'FF2E5C8A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDCE6F1' },
  };
  titleCell.border = {
    top: { style: 'medium' },
    left: { style: 'medium' },
    bottom: { style: 'medium' },
    right: { style: 'medium' },
  };

  currentRow += 4;

  // ========== LANDLORD INFO SECTION ==========
  const landlordStartRow = currentRow;
  worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
  const landlordHeaderCell = worksheet.getCell(`A${currentRow}`);
  landlordHeaderCell.value = fromLandlord;
  landlordHeaderCell.font = {
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  landlordHeaderCell.alignment = {
    vertical: 'middle',
    horizontal: 'left',
    indent: 1,
  };
  landlordHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  currentRow++;

  const ownerInfo = [
    [nameLabel, bankInfo.bankAccountName],
    [addressLabel, houseInfo.houseAddress],
    [
      phoneLabel,
      `${houseInfo.houseOwnerPhoneNumber || ''} - ${houseInfo.houseOwnerBackupPhoneNumber || ''}`,
    ],
    [bankAccountLabel, `${bankInfo.bankName} - ${bankInfo.bankAccountNumber}`],
  ];

  ownerInfo.forEach(([label, value]) => {
    worksheet.getCell(`A${currentRow}`).value = `${label}:`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 10 };
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = value;
    worksheet.getCell(`B${currentRow}`).font = { size: 10 };
    currentRow++;
  });

  // ========== INVOICE DETAILS SECTION ==========
  const detailsStartRow = landlordStartRow;
  worksheet.mergeCells(`D${detailsStartRow}:F${detailsStartRow}`);
  const detailsHeaderCell = worksheet.getCell(`D${detailsStartRow}`);
  detailsHeaderCell.value = invoiceDetailsTitle;
  detailsHeaderCell.font = {
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  detailsHeaderCell.alignment = {
    vertical: 'middle',
    horizontal: 'left',
    indent: 1,
  };
  detailsHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF70AD47' },
  };

  let detailsRow = detailsStartRow + 1;
  const invoiceDetails = [
    [invoiceNoLabel, `${room.name}-${dayjs(data.from).format('YYYY-MM')}`],
    [invoiceDateLabel, dayjs(data.from).format('DD/MM/YYYY')],
    [dueDateLabel, dayjs(data.to).add(5, 'day').format('DD/MM/YYYY')],
    [
      billingPeriodLabel,
      `${dayjs(data.from).format('DD/MM/YYYY')} - ${dayjs(data.to).format('DD/MM/YYYY')}`,
    ],
  ];

  invoiceDetails.forEach(([label, value]) => {
    worksheet.getCell(`D${detailsRow}`).value = `${label}:`;
    worksheet.getCell(`D${detailsRow}`).font = { bold: true, size: 10 };
    worksheet.mergeCells(`E${detailsRow}:F${detailsRow}`);
    worksheet.getCell(`E${detailsRow}`).value = value;
    worksheet.getCell(`E${detailsRow}`).font = { size: 10 };
    detailsRow++;
  });

  currentRow = Math.max(currentRow, detailsRow) + 1;

  // ========== TENANT INFO SECTION ==========
  worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const tenantHeaderCell = worksheet.getCell(`A${currentRow}`);
  tenantHeaderCell.value = billToTenant;
  tenantHeaderCell.font = {
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  tenantHeaderCell.alignment = {
    vertical: 'middle',
    horizontal: 'left',
    indent: 1,
  };
  tenantHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFED7D31' },
  };
  currentRow++;

  const tenantInfo = [
    [tenantNameLabel, tenant.name, roomNumberLabel, room.name],
    [phoneNumberLabel, tenant.phoneNumber, idNumberLabel, tenant.citizenId],
  ];

  tenantInfo.forEach(([label1, value1, label2, value2]) => {
    worksheet.getCell(`A${currentRow}`).value = `${label1}:`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 10 };
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = value1;
    worksheet.getCell(`B${currentRow}`).font = { size: 10 };

    worksheet.getCell(`D${currentRow}`).value = `${label2}:`;
    worksheet.getCell(`D${currentRow}`).font = { bold: true, size: 10 };
    worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
    worksheet.getCell(`E${currentRow}`).value = value2;
    worksheet.getCell(`E${currentRow}`).font = { size: 10 };
    currentRow++;
  });

  currentRow += 1;

  // ========== BILLING ITEMS TABLE ==========
  const tableHeaderRow = currentRow;
  const tableHeaders = [
    noLabel,
    descriptionLabel,
    quantityLabel,
    unitPriceLabel,
    amountLabel,
  ];
  const tableColumns = ['A', 'B', 'C', 'D', 'E'];

  tableColumns.forEach((col, index) => {
    const cell = worksheet.getCell(`${col}${tableHeaderRow}`);
    cell.value = tableHeaders[index];
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E5C8A' },
    };
    cell.border = {
      top: { style: 'medium' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' },
    };
  });

  currentRow++;

  data.items.forEach((item, index) => {
    worksheet.getCell(`A${currentRow}`).value = index + 1;
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };

    worksheet.getCell(`B${currentRow}`).value = item.description;
    worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left' };

    worksheet.getCell(`C${currentRow}`).value = Number(item.quantity);
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center' };

    worksheet.getCell(`D${currentRow}`).value = Number(item.unitPrice);
    worksheet.getCell(`D${currentRow}`).numFmt = '#,##0';
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'right' };

    worksheet.getCell(`E${currentRow}`).value = Number(item.amount);
    worksheet.getCell(`E${currentRow}`).numFmt = '#,##0';
    worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'right' };

    ['A', 'B', 'C', 'D', 'E'].forEach((col) => {
      const cell = worksheet.getCell(`${col}${currentRow}`);
      cell.border = {
        left: { style: 'thin' },
        right: { style: 'thin' },
        top: { style: 'thin' },
        bottom: { style: 'thin' },
      };
    });

    currentRow++;
  });

  currentRow += 1;

  // ========== UTILITY METER READINGS TABLE ==========
  if (hasUtilityMeterReadings(utilityDetails)) {
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const utilityHeaderCell = worksheet.getCell(`A${currentRow}`);
    utilityHeaderCell.value = utilityTitle;
    utilityHeaderCell.font = {
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    utilityHeaderCell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    utilityHeaderCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9C27B0' },
    };
    currentRow++;

    const utilityTableHeaders = [
      indexLabel,
      contentLabel,
      clockIndexLabel,
      usageAmountLabel,
      pricePerUnitLabel,
      totalLabel,
    ];
    const utilityColumns = ['A', 'B', 'C', 'D', 'E', 'F'];

    utilityColumns.forEach((col, index) => {
      const cell = worksheet.getCell(`${col}${currentRow}`);
      cell.value = utilityTableHeaders[index];
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF673AB7' },
      };
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' },
      };
    });

    currentRow++;

    let utilityRowIndex = 1;

    // Electric Meter Readings
    if (
      utilityDetails?.electric_start_index !== undefined &&
      utilityDetails?.electric_end_index !== undefined &&
      utilityDetails?.electric_price_unit !== undefined
    ) {
      const electricUsage =
        utilityDetails.electric_end_index - utilityDetails.electric_start_index;
      const electricTotal = electricUsage * utilityDetails.electric_price_unit;

      // Start Index Row
      worksheet.getCell(`A${currentRow}`).value = utilityRowIndex++;
      worksheet.getCell(`A${currentRow}`).alignment = {
        horizontal: 'center',
      };

      worksheet.getCell(`B${currentRow}`).value = electricLabel;
      worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left' };

      worksheet.getCell(`C${currentRow}`).value =
        `${startLabel}: ${utilityDetails.electric_start_index}`;
      worksheet.getCell(`C${currentRow}`).alignment = {
        horizontal: 'center',
      };

      worksheet.mergeCells(`D${currentRow}:D${currentRow + 1}`);
      worksheet.getCell(`D${currentRow}`).value = electricUsage;
      worksheet.getCell(`D${currentRow}`).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
      worksheet.getCell(`D${currentRow}`).font = { bold: true };

      worksheet.mergeCells(`E${currentRow}:E${currentRow + 1}`);
      worksheet.getCell(`E${currentRow}`).value =
        utilityDetails.electric_price_unit;
      worksheet.getCell(`E${currentRow}`).numFmt = '#,##0';
      worksheet.getCell(`E${currentRow}`).alignment = {
        vertical: 'middle',
        horizontal: 'right',
      };

      worksheet.mergeCells(`F${currentRow}:F${currentRow + 1}`);
      worksheet.getCell(`F${currentRow}`).value = electricTotal;
      worksheet.getCell(`F${currentRow}`).numFmt = '#,##0';
      worksheet.getCell(`F${currentRow}`).alignment = {
        vertical: 'middle',
        horizontal: 'right',
      };
      worksheet.getCell(`F${currentRow}`).font = { bold: true };

      utilityColumns.forEach((col) => {
        const cell = worksheet.getCell(`${col}${currentRow}`);
        cell.border = {
          left: { style: 'thin' },
          right: { style: 'thin' },
          top: { style: 'thin' },
          bottom: { style: 'thin' },
        };
      });

      currentRow++;

      // End Index Row
      worksheet.getCell(`A${currentRow}`).value = utilityRowIndex++;
      worksheet.getCell(`A${currentRow}`).alignment = {
        horizontal: 'center',
      };

      worksheet.getCell(`B${currentRow}`).value = electricLabel;
      worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left' };

      worksheet.getCell(`C${currentRow}`).value =
        `${endLabel}: ${utilityDetails.electric_end_index}`;
      worksheet.getCell(`C${currentRow}`).alignment = {
        horizontal: 'center',
      };

      utilityColumns.forEach((col) => {
        const cell = worksheet.getCell(`${col}${currentRow}`);
        cell.border = {
          left: { style: 'thin' },
          right: { style: 'thin' },
          top: { style: 'thin' },
          bottom: { style: 'thin' },
        };
      });

      currentRow++;
    }

    // Water Meter Readings
    if (
      utilityDetails?.water_start_index !== undefined &&
      utilityDetails?.water_end_index !== undefined &&
      utilityDetails?.water_price_unit !== undefined
    ) {
      const waterUsage =
        utilityDetails.water_end_index - utilityDetails.water_start_index;
      const waterTotal = waterUsage * utilityDetails.water_price_unit;

      // Start Index Row
      worksheet.getCell(`A${currentRow}`).value = utilityRowIndex++;
      worksheet.getCell(`A${currentRow}`).alignment = {
        horizontal: 'center',
      };

      worksheet.getCell(`B${currentRow}`).value = waterLabel;
      worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left' };

      worksheet.getCell(`C${currentRow}`).value =
        `${startLabel}: ${utilityDetails.water_start_index}`;
      worksheet.getCell(`C${currentRow}`).alignment = {
        horizontal: 'center',
      };

      worksheet.mergeCells(`D${currentRow}:D${currentRow + 1}`);
      worksheet.getCell(`D${currentRow}`).value = waterUsage;
      worksheet.getCell(`D${currentRow}`).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
      worksheet.getCell(`D${currentRow}`).font = { bold: true };

      worksheet.mergeCells(`E${currentRow}:E${currentRow + 1}`);
      worksheet.getCell(`E${currentRow}`).value =
        utilityDetails.water_price_unit;
      worksheet.getCell(`E${currentRow}`).numFmt = '#,##0';
      worksheet.getCell(`E${currentRow}`).alignment = {
        vertical: 'middle',
        horizontal: 'right',
      };

      worksheet.mergeCells(`F${currentRow}:F${currentRow + 1}`);
      worksheet.getCell(`F${currentRow}`).value = waterTotal;
      worksheet.getCell(`F${currentRow}`).numFmt = '#,##0';
      worksheet.getCell(`F${currentRow}`).alignment = {
        vertical: 'middle',
        horizontal: 'right',
      };
      worksheet.getCell(`F${currentRow}`).font = { bold: true };

      utilityColumns.forEach((col) => {
        const cell = worksheet.getCell(`${col}${currentRow}`);
        cell.border = {
          left: { style: 'thin' },
          right: { style: 'thin' },
          top: { style: 'thin' },
          bottom: { style: 'thin' },
        };
      });

      currentRow++;

      // End Index Row
      worksheet.getCell(`A${currentRow}`).value = utilityRowIndex++;
      worksheet.getCell(`A${currentRow}`).alignment = {
        horizontal: 'center',
      };

      worksheet.getCell(`B${currentRow}`).value = waterLabel;
      worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left' };

      worksheet.getCell(`C${currentRow}`).value =
        `${endLabel}: ${utilityDetails.water_end_index}`;
      worksheet.getCell(`C${currentRow}`).alignment = {
        horizontal: 'center',
      };

      utilityColumns.forEach((col) => {
        const cell = worksheet.getCell(`${col}${currentRow}`);
        cell.border = {
          left: { style: 'thin' },
          right: { style: 'thin' },
          top: { style: 'thin' },
          bottom: { style: 'thin' },
        };
      });

      currentRow++;
    }

    currentRow += 1;
  }

  // ========== SUMMARY SECTION ==========
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = subtotalLabel;
  worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 11 };
  worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right' };
  worksheet.getCell(`E${currentRow}`).value = totalAmount;
  worksheet.getCell(`E${currentRow}`).numFmt = '#,##0';
  worksheet.getCell(`E${currentRow}`).font = { bold: true };
  worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'right' };
  worksheet.getCell(`E${currentRow}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF2F2F2' },
  };
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = totalAmountDueLabel;
  worksheet.getCell(`A${currentRow}`).font = {
    bold: true,
    size: 12,
    color: { argb: 'FFFFFFFF' },
  };
  worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right' };
  worksheet.getCell(`A${currentRow}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFED7D31' },
  };
  worksheet.getCell(`E${currentRow}`).value = totalAmount;
  worksheet.getCell(`E${currentRow}`).numFmt = '#,##0';
  worksheet.getCell(`E${currentRow}`).font = {
    bold: true,
    size: 12,
    color: { argb: 'FFFFFFFF' },
  };
  worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'right' };
  worksheet.getCell(`E${currentRow}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFED7D31' },
  };
  worksheet.getCell(`E${currentRow}`).border = {
    top: { style: 'medium' },
    left: { style: 'medium' },
    bottom: { style: 'medium' },
    right: { style: 'medium' },
  };
  currentRow += 2;

  // ========== NOTES SECTION ==========
  if (data.notes) {
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = notesLabel;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 10 };
    currentRow++;

    worksheet.mergeCells(`A${currentRow}:F${currentRow + 2}`);
    const notesCell = worksheet.getCell(`A${currentRow}`);
    notesCell.value = data.notes;
    notesCell.font = { size: 9, italic: true };
    notesCell.alignment = {
      vertical: 'top',
      horizontal: 'left',
      wrapText: true,
    };
    notesCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFEF2' },
    };
    notesCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    currentRow += 3;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
