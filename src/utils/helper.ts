export const numberToVietnameseText = (num: number): string => {
  const ones = [
    '',
    'một',
    'hai',
    'ba',
    'bốn',
    'năm',
    'sáu',
    'bảy',
    'tám',
    'chín',
  ];
  const tens = [
    '',
    '',
    'hai mươi',
    'ba mươi',
    'bốn mươi',
    'năm mươi',
    'sáu mươi',
    'bảy mươi',
    'tám mươi',
    'chín mươi',
  ];
  const scales = ['', 'nghìn', 'triệu', 'tỷ'];

  if (num === 0) return 'không đồng';

  const convertHundreds = (n: number): string => {
    let result = '';
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    const ten = Math.floor(remainder / 10);
    const one = remainder % 10;

    if (hundred > 0) {
      result += ones[hundred] + ' trăm';
      if (remainder > 0) result += ' ';
    }

    if (ten >= 2) {
      result += tens[ten];
      if (one > 0) {
        result += ' ' + ones[one];
      }
    } else if (ten === 1) {
      result += 'mười';
      if (one > 0) {
        result += ' ' + ones[one];
      }
    } else if (one > 0 && hundred > 0) {
      result += 'lẻ ' + ones[one];
    } else if (one > 0) {
      result += ones[one];
    }

    return result;
  };

  const convertNumber = (n: number): string => {
    if (n === 0) return '';

    let result = '';
    let scaleIndex = 0;

    while (n > 0) {
      const group = n % 1000;
      if (group > 0) {
        const groupText = convertHundreds(group);
        if (scaleIndex > 0) {
          result =
            groupText + ' ' + scales[scaleIndex] + (result ? ' ' + result : '');
        } else {
          result = groupText;
        }
      }
      n = Math.floor(n / 1000);
      scaleIndex++;
    }

    return result;
  };

  return convertNumber(num) + ' đồng';
};

// Safe getter using dot-paths (no external deps)
export function getByPath(obj: unknown, path?: string): unknown {
  // Fast return when path is empty
  if (!obj || !path) return undefined;
  // Split segments while skipping empties
  const segs = path.split('.').filter(Boolean);
  // Walk object step by step
  let cur: any = obj;
  for (const s of segs) {
    if (cur == null) return undefined;
    cur = cur[s];
  }
  // Return final value or undefined
  return cur;
}
