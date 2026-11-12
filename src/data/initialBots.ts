import { BotTable } from '../types';

export const initialBots: BotTable[] = [
  {
    id: 'bot_ledger_1',
    name: 'Customer Accounts & Ledger',
    description: 'Track paid customers, item quality/quantity, paid amounts & remaining balance',
    folder: 'Customer Ledger',
    telegramToken: '',
    botUsername: '@CustomerAccountsBot',
    botStatus: 'simulator',
    isFavorite: true,
    updatedAt: new Date().toISOString(),
    columns: [
      {
        id: 'col_cname',
        name: 'Customer Name',
        type: 'text',
        widthMultiplier: 1.4,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: true, italic: false, align: 'left', color: '#0D47A1', bgColor: '#FFFFFF' },
        includeInGraph: true
      },
      {
        id: 'col_quality',
        name: 'Quality / Quantity',
        type: 'text',
        widthMultiplier: 1.3,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: false, italic: false, align: 'left', color: '#1E293B', bgColor: '#FFFFFF' },
        includeInGraph: true
      },
      {
        id: 'col_total',
        name: 'Total Amount',
        type: 'amount',
        widthMultiplier: 1.1,
        currency: '$',
        thousandSeparator: true,
        decimals: 2,
        style: { bold: true, italic: false, align: 'right', color: '#1E293B', bgColor: '#FFFFFF' },
        includeInGraph: true
      },
      {
        id: 'col_paid',
        name: 'Paid Amount',
        type: 'amount',
        widthMultiplier: 1.1,
        currency: '$',
        thousandSeparator: true,
        decimals: 2,
        style: { bold: true, italic: false, align: 'right', color: '#2E7D32', bgColor: '#FFFFFF' },
        includeInGraph: true
      },
      {
        id: 'col_balance',
        name: 'Remaining Balance',
        type: 'amount',
        widthMultiplier: 1.2,
        currency: '$',
        thousandSeparator: true,
        decimals: 2,
        style: { bold: true, italic: false, align: 'right', color: '#E65100', bgColor: '#FFFFFF' },
        includeInGraph: true
      },
      {
        id: 'col_status',
        name: 'Payment Status',
        type: 'text',
        widthMultiplier: 1.0,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: false, italic: false, align: 'center', color: '#0D47A1', bgColor: '#FFFFFF' },
        includeInGraph: true
      },
      {
        id: 'col_date',
        name: 'Transaction Date',
        type: 'date',
        widthMultiplier: 1.1,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: false, italic: false, align: 'left', color: '#64748B', bgColor: '#FFFFFF' },
        includeInGraph: false
      }
    ],
    rows: [
      {
        id: 'ledger_r1',
        col_cname: 'Alexander Wright (@alex_w)',
        col_quality: '10x Grade-A Specialty Coffee',
        col_total: 450.00,
        col_paid: 450.00,
        col_balance: 0.00,
        col_status: 'Paid in Full',
        col_date: '2026-11-12 09:15'
      },
      {
        id: 'ledger_r2',
        col_cname: 'Sophia Miller (@sophiam)',
        col_quality: '5x Enterprise Cloud Seats',
        col_total: 1250.00,
        col_paid: 800.00,
        col_balance: 450.00,
        col_status: 'Partial ($450 due)',
        col_date: '2026-11-12 08:30'
      },
      {
        id: 'ledger_r3',
        col_cname: 'Daniel Chen (@chendan)',
        col_quality: '25x Premium Cotton Fabric',
        col_total: 875.00,
        col_paid: 875.00,
        col_balance: 0.00,
        col_status: 'Paid in Full',
        col_date: '2026-11-11 15:40'
      },
      {
        id: 'ledger_r4',
        col_cname: 'Elena Rostova (@elena_r)',
        col_quality: '2x 4K Studio Monitors (Refurb)',
        col_total: 920.00,
        col_paid: 500.00,
        col_balance: 420.00,
        col_status: 'Partial ($420 due)',
        col_date: '2026-11-10 11:20'
      },
      {
        id: 'ledger_r5',
        col_cname: 'Marcus Vance (@marcus_v)',
        col_quality: '50x Stainless Steel Fittings',
        col_total: 620.00,
        col_paid: 620.00,
        col_balance: 0.00,
        col_status: 'Paid in Full',
        col_date: '2026-11-09 14:10'
      },
      {
        id: 'ledger_r6',
        col_cname: 'Sarah Connor (@s_connor)',
        col_quality: '1x Custom Telegram Bot Suite',
        col_total: 1500.00,
        col_paid: 750.00,
        col_balance: 750.00,
        col_status: 'Partial ($750 due)',
        col_date: '2026-11-06 17:00'
      },
      {
        id: 'ledger_r7',
        col_cname: 'David Kim (@dkim)',
        col_quality: '15x High-Grade Copper Wire Rolls',
        col_total: 1100.00,
        col_paid: 1100.00,
        col_balance: 0.00,
        col_status: 'Paid in Full',
        col_date: '2026-11-03 10:45'
      },
      {
        id: 'ledger_r8',
        col_cname: 'Amira Hassan (@amira_h)',
        col_quality: '8x Heavy-Duty Cargo Straps',
        col_total: 320.00,
        col_paid: 100.00,
        col_balance: 220.00,
        col_status: 'Partial ($220 due)',
        col_date: '2026-11-01 13:30'
      }
    ]
  },
  {
    id: 'bot_sales_2',
    name: 'SalesTracker_Bot',
    description: 'Instant Telegram checkout, invoice receipts & sums',
    folder: 'Sales & Orders',
    telegramToken: '',
    botUsername: '@StoreCheckoutBot',
    botStatus: 'simulator',
    isFavorite: true,
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    columns: [
      {
        id: 'col_buyer',
        name: 'Customer / Chat',
        type: 'text',
        widthMultiplier: 1.3,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: false, italic: false, align: 'left', color: '#1E293B', bgColor: '#FFFFFF' },
        includeInGraph: true
      },
      {
        id: 'col_item',
        name: 'Order Item',
        type: 'text',
        widthMultiplier: 1.2,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: false, italic: false, align: 'left', color: '#1E293B', bgColor: '#FFFFFF' },
        includeInGraph: true
      },
      {
        id: 'col_amount',
        name: 'Amount Paid',
        type: 'amount',
        widthMultiplier: 1.1,
        currency: '$',
        thousandSeparator: true,
        decimals: 2,
        style: { bold: true, italic: false, align: 'right', color: '#E65100', bgColor: '#FFFFFF' },
        includeInGraph: true
      },
      {
        id: 'col_verified',
        name: 'Verified',
        type: 'checkbox',
        widthMultiplier: 0.8,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: false, italic: false, align: 'center', color: '#1E293B', bgColor: '#FFFFFF' },
        includeInGraph: false
      },
      {
        id: 'col_state',
        name: 'Fulfillment',
        type: 'text',
        widthMultiplier: 1.0,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: false, italic: false, align: 'center', color: '#1565C0', bgColor: '#FFFFFF' },
        includeInGraph: true
      }
    ],
    rows: [
      {
        id: 'row_s1',
        col_buyer: '1092834 @johndoe',
        col_item: 'Pro Subscription (Annual)',
        col_amount: 120.00,
        col_verified: true,
        col_state: 'Activated'
      },
      {
        id: 'row_s2',
        col_buyer: '9920182 @elenak',
        col_item: 'API Access Token Pack',
        col_amount: 49.99,
        col_verified: true,
        col_state: 'Delivered'
      },
      {
        id: 'row_s3',
        col_buyer: '4459102 @mark_dev',
        col_item: 'Custom Bot Setup Plugin',
        col_amount: 250.00,
        col_verified: true,
        col_state: 'In Progress'
      },
      {
        id: 'row_s4',
        col_buyer: '6102938 @lisa_w',
        col_item: 'Starter Tier Upgrade',
        col_amount: 19.00,
        col_verified: false,
        col_state: 'Pending'
      }
    ]
  },
  {
    id: 'bot_crypto_1',
    name: 'CryptoAlert Bot',
    description: 'Telegram price threshold monitor & user trigger alerts',
    folder: 'Crypto Alerts',
    telegramToken: '',
    botUsername: '@CryptoAlert_LiveBot',
    botStatus: 'simulator',
    isFavorite: true,
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    columns: [
      {
        id: 'col_user',
        name: 'User ID / Name',
        type: 'text',
        widthMultiplier: 1.3,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: false, italic: false, align: 'left', color: '#1E293B', bgColor: '#FFFFFF' },
        includeInGraph: true
      },
      {
        id: 'col_pair',
        name: 'Token / Pair',
        type: 'text',
        widthMultiplier: 0.9,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: true, italic: false, align: 'left', color: '#0D47A1', bgColor: '#FFFFFF' },
        includeInGraph: true
      },
      {
        id: 'col_target',
        name: 'Alert Target',
        type: 'amount',
        widthMultiplier: 1.1,
        currency: '$',
        thousandSeparator: true,
        decimals: 2,
        style: { bold: true, italic: false, align: 'right', color: '#E65100', bgColor: '#FFFFFF' },
        includeInGraph: true
      },
      {
        id: 'col_status',
        name: 'Status',
        type: 'text',
        widthMultiplier: 1.0,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: false, italic: false, align: 'center', color: '#2E7D32', bgColor: '#FFFFFF' },
        includeInGraph: true
      },
      {
        id: 'col_date',
        name: 'Date / Time',
        type: 'date',
        widthMultiplier: 1.1,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: false, italic: false, align: 'left', color: '#64748B', bgColor: '#FFFFFF' },
        includeInGraph: false
      }
    ],
    rows: [
      {
        id: 'row_1',
        col_user: '7482918 @crypto_whale',
        col_pair: 'BTC / USD',
        col_target: 95500.00,
        col_status: 'Triggered',
        col_date: '2026-11-12 09:30'
      },
      {
        id: 'row_2',
        col_user: '9128342 @sarah_eth',
        col_pair: 'ETH / USD',
        col_target: 3450.50,
        col_status: 'Monitoring',
        col_date: '2026-11-12 08:45'
      },
      {
        id: 'row_3',
        col_user: '5561234 @alex_trader',
        col_pair: 'SOL / USD',
        col_target: 210.00,
        col_status: 'Monitoring',
        col_date: '2026-11-12 07:15'
      },
      {
        id: 'row_4',
        col_user: '8839201 @maria_defi',
        col_pair: 'BNB / USD',
        col_target: 640.00,
        col_status: 'Triggered',
        col_date: '2026-11-11 22:10'
      }
    ]
  },
  {
    id: 'bot_support_3',
    name: 'SupportHelper_Bot',
    description: 'Helpdesk ticket manager & auto response dispatcher',
    folder: 'Support Tickets',
    telegramToken: '',
    botUsername: '@SupportHelper_Bot',
    botStatus: 'simulator',
    isFavorite: false,
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    columns: [
      {
        id: 'col_tid',
        name: 'Ticket #',
        type: 'text',
        widthMultiplier: 0.8,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: true, italic: false, align: 'center', color: '#0D47A1', bgColor: '#FFFFFF' },
        includeInGraph: false
      },
      {
        id: 'col_user',
        name: 'Telegram User',
        type: 'text',
        widthMultiplier: 1.2,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: false, italic: false, align: 'left', color: '#1E293B', bgColor: '#FFFFFF' },
        includeInGraph: true
      },
      {
        id: 'col_inquiry',
        name: 'Inquiry / Command',
        type: 'text',
        widthMultiplier: 1.6,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: false, italic: false, align: 'left', color: '#1E293B', bgColor: '#FFFFFF' },
        includeInGraph: false
      },
      {
        id: 'col_score',
        name: 'Priority / Score',
        type: 'number',
        widthMultiplier: 0.9,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: true, italic: false, align: 'right', color: '#E65100', bgColor: '#FFFFFF' },
        includeInGraph: true
      },
      {
        id: 'col_status',
        name: 'Status',
        type: 'text',
        widthMultiplier: 1.0,
        currency: 'None',
        thousandSeparator: false,
        decimals: 0,
        style: { bold: false, italic: false, align: 'center', color: '#2E7D32', bgColor: '#FFFFFF' },
        includeInGraph: true
      }
    ],
    rows: [
      {
        id: 'row_h1',
        col_tid: '#1042',
        col_user: '8910293 @dev_sam',
        col_inquiry: '/reset_token - Credentials expired',
        col_score: 9,
        col_status: 'Resolved'
      },
      {
        id: 'row_h2',
        col_tid: '#1043',
        col_user: '6719283 @anna_ui',
        col_inquiry: '/help - How to export CSV reports?',
        col_score: 4,
        col_status: 'Replied'
      },
      {
        id: 'row_h3',
        col_tid: '#1044',
        col_user: '3391029 @chen_b',
        col_inquiry: '/billing - Invoice query for order #992',
        col_score: 7,
        col_status: 'Open'
      }
    ]
  }
];
