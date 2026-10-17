import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, api } from '../lib/api';
import { useAuth } from './AuthContext';
import type {
  AppNotification,
  ImportResult,
  Item,
  ItemPayload,
  NotificationType,
  Transaction,
  TransactionFilters,
  TransactionPayload,
} from '../types/inventory';

interface ActionResponse {
  success: boolean;
  message: string;
}

interface InventoryContextType {
  items: Item[];
  transactions: Transaction[];
  lowStockItems: Item[];
  totalItemsCount: number;
  totalStockCount: number;
  recentTransactions: Transaction[];
  loading: boolean;
  notifications: AppNotification[];
  dismissNotification: (id: string) => void;
  notify: (type: NotificationType, title: string, message: string) => void;
  refresh: () => Promise<void>;
  addItem: (data: ItemPayload) => Promise<ActionResponse>;
  updateItem: (id: string, data: ItemPayload) => Promise<ActionResponse>;
  deleteItem: (id: string) => Promise<ActionResponse>;
  recordStockIn: (data: Omit<TransactionPayload, 'type'>) => Promise<ActionResponse>;
  recordStockOut: (data: Omit<TransactionPayload, 'type'>) => Promise<ActionResponse>;
  importItems: (file: File) => Promise<ImportResult | null>;
  exportItems: () => Promise<void>;
  downloadItemTemplate: () => Promise<void>;
  exportTransactions: (filters: TransactionFilters) => Promise<void>;
  printReport: (filters: TransactionFilters) => Promise<void>;
  printNota: (transactionId: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Terjadi kesalahan yang tidak diketahui.';
}

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const notify = useCallback((type: NotificationType, title: string, message: string) => {
    const notification: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
    };

    setNotifications((prev) => [notification, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((entry) => entry.id !== notification.id));
    }, 4500);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsResult, transactionsResult] = await Promise.all([
        api.listItems(),
        api.listTransactions({ limit: 500 }),
      ]);
      setItems(itemsResult.items);
      setTransactions(transactionsResult.transactions);
    } catch (error) {
      notify('error', 'Gagal Memuat Data', errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setTransactions([]);
      return;
    }
    void refresh();
  }, [user, refresh]);

  const lowStockItems = useMemo(() => items.filter((item) => Number(item.stock) <= Number(item.minStock)), [items]);

  const totalStockCount = useMemo(
    () => items.reduce((acc, item) => acc + (Number(item.stock) || 0), 0),
    [items]
  );

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort(
        (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
      )
      .slice(0, 5);
  }, [transactions]);

  const addItem = useCallback(
    async (data: ItemPayload): Promise<ActionResponse> => {
      try {
        await api.createItem(data);
        await refresh();
        notify('success', 'Barang Ditambahkan', `Barang "${data.name}" berhasil disimpan.`);
        return { success: true, message: 'Barang berhasil disimpan' };
      } catch (error) {
        const message = errorMessage(error);
        notify('error', 'Gagal Menyimpan', message);
        return { success: false, message };
      }
    },
    [notify, refresh]
  );

  const updateItem = useCallback(
    async (id: string, data: ItemPayload): Promise<ActionResponse> => {
      try {
        await api.updateItem(id, data);
        await refresh();
        notify('success', 'Barang Diperbarui', `Data barang "${data.name}" berhasil diperbarui.`);
        return { success: true, message: 'Data barang berhasil diperbarui' };
      } catch (error) {
        const message = errorMessage(error);
        notify('error', 'Gagal Memperbarui', message);
        return { success: false, message };
      }
    },
    [notify, refresh]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<ActionResponse> => {
      const target = items.find((item) => item.id === id);
      try {
        await api.deleteItem(id);
        await refresh();
        notify('info', 'Barang Dihapus', `Barang "${target?.name ?? ''}" telah dihapus dari inventaris.`);
        return { success: true, message: 'Barang berhasil dihapus' };
      } catch (error) {
        const message = errorMessage(error);
        notify('error', 'Gagal Menghapus', message);
        return { success: false, message };
      }
    },
    [items, notify, refresh]
  );

  const submitTransaction = useCallback(
    async (payload: TransactionPayload, itemName: string, unit: string): Promise<ActionResponse> => {
      try {
        const result = await api.createTransaction(payload);
        await refresh();

        if (payload.type === 'IN') {
          notify(
            'success',
            'Stok Masuk Berhasil',
            `Berhasil menambahkan +${payload.quantity} ${unit} "${itemName}". Total stok sekarang: ${result.item.stock} ${unit}.`
          );
        } else {
          notify(
            'success',
            'Stok Keluar Berhasil',
            `Berhasil mengeluarkan -${payload.quantity} ${unit} "${itemName}". Sisa stok: ${result.item.stock} ${unit}.`
          );

          if (result.item.stock <= result.item.minStock) {
            setTimeout(() => {
              notify(
                'warning',
                'Peringatan Stok Menipis',
                `Perhatian: stok "${itemName}" kini ${result.item.stock} ${unit} (batas minimum ${result.item.minStock} ${unit}). Segera restock!`
              );
            }, 400);
          }
        }

        return { success: true, message: 'Transaksi berhasil dicatat' };
      } catch (error) {
        const message = errorMessage(error);
        notify('error', 'Transaksi Gagal', message);
        return { success: false, message };
      }
    },
    [notify, refresh]
  );

  const recordStockIn = useCallback(
    async (data: Omit<TransactionPayload, 'type'>): Promise<ActionResponse> => {
      const item = items.find((entry) => entry.id === data.itemId);
      return submitTransaction({ ...data, type: 'IN' }, item?.name ?? '', item?.unit ?? '');
    },
    [items, submitTransaction]
  );

  const recordStockOut = useCallback(
    async (data: Omit<TransactionPayload, 'type'>): Promise<ActionResponse> => {
      const item = items.find((entry) => entry.id === data.itemId);
      return submitTransaction({ ...data, type: 'OUT' }, item?.name ?? '', item?.unit ?? '');
    },
    [items, submitTransaction]
  );

  const importItems = useCallback(
    async (file: File): Promise<ImportResult | null> => {
      try {
        const result = await api.importItems(file);
        await refresh();

        const summary = `${result.created} barang baru, ${result.updated} diperbarui${
          result.failed > 0 ? `, ${result.failed} baris dilewati` : ''
        }.`;

        if (result.failed > 0) {
          notify('warning', 'Import Selesai dengan Catatan', summary);
        } else {
          notify('success', 'Import Berhasil', summary);
        }

        return result;
      } catch (error) {
        notify('error', 'Import Gagal', errorMessage(error));
        return null;
      }
    },
    [notify, refresh]
  );

  const exportItems = useCallback(async () => {
    try {
      await api.exportItems();
      notify('success', 'Ekspor Dimulai', 'File Excel data barang sedang diunduh.');
    } catch (error) {
      notify('error', 'Ekspor Gagal', errorMessage(error));
    }
  }, [notify]);

  const downloadItemTemplate = useCallback(async () => {
    try {
      await api.downloadItemTemplate();
    } catch (error) {
      notify('error', 'Unduh Gagal', errorMessage(error));
    }
  }, [notify]);

  const exportTransactions = useCallback(
    async (filters: TransactionFilters) => {
      try {
        await api.exportTransactions(filters);
        notify('success', 'Ekspor Dimulai', 'File Excel riwayat transaksi sedang diunduh.');
      } catch (error) {
        notify('error', 'Ekspor Gagal', errorMessage(error));
      }
    },
    [notify]
  );

  const printReport = useCallback(
    async (filters: TransactionFilters) => {
      try {
        await api.printTransactionReport(filters);
      } catch (error) {
        notify('error', 'Cetak Gagal', errorMessage(error));
      }
    },
    [notify]
  );

  const printNota = useCallback(
    async (transactionId: string) => {
      try {
        await api.printNota(transactionId);
      } catch (error) {
        notify('error', 'Cetak Gagal', errorMessage(error));
      }
    },
    [notify]
  );

  const value = useMemo<InventoryContextType>(
    () => ({
      items,
      transactions,
      lowStockItems,
      totalItemsCount: items.length,
      totalStockCount,
      recentTransactions,
      loading,
      notifications,
      dismissNotification,
      notify,
      refresh,
      addItem,
      updateItem,
      deleteItem,
      recordStockIn,
      recordStockOut,
      importItems,
      exportItems,
      downloadItemTemplate,
      exportTransactions,
      printReport,
      printNota,
    }),
    [
      items,
      transactions,
      lowStockItems,
      totalStockCount,
      recentTransactions,
      loading,
      notifications,
      dismissNotification,
      notify,
      refresh,
      addItem,
      updateItem,
      deleteItem,
      recordStockIn,
      recordStockOut,
      importItems,
      exportItems,
      downloadItemTemplate,
      exportTransactions,
      printReport,
      printNota,
    ]
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory harus dipakai di dalam InventoryProvider');
  }
  return context;
};
