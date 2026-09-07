import { View, Text } from "react-native";

export default function HistoryScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-linen-bg dark:bg-cypress-bg p-6">
      <Text className="text-xl font-bold text-linen-text-primary dark:text-cypress-text-primary">
        Riwayat Transaksi
      </Text>
      <Text className="mt-2 text-center text-sm text-linen-text-secondary dark:text-cypress-text-secondary">
        Daftar mutasi pengeluaran dan pemasukan akan tampil di sini.
      </Text>
    </View>
  )
}
