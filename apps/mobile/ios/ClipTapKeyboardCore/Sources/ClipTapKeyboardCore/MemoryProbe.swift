import Foundation

/**
 * 拡張キーボードのメモリ使用量を測るための計測子
 *
 * iOSのキーボード拡張にはアプリ本体より遥かに厳しいメモリ上限があり、
 * 超過するとクラッシュではなくOSによる即時終了として現れる。
 * 変換エンジンを載せられるかどうかはこの上限との勝負になるため、
 * 開発中に実測できる手段を用意する。
 */
public enum MemoryProbe {

    /**
     * 現在のプロセスが使用している常駐メモリ量（バイト）
     *
     * `mach_task_basic_info`の`phys_footprint`を用いる。
     * これはOSが上限判定に使う値と同じ意味を持つため、
     * `resident_size`より実態に近い。
     */
    public static func footprintBytes() -> UInt64? {
        var info = task_vm_info_data_t()
        var count = mach_msg_type_number_t(MemoryLayout<task_vm_info_data_t>.size / MemoryLayout<natural_t>.size)

        let result = withUnsafeMutablePointer(to: &info) { pointer in
            pointer.withMemoryRebound(to: integer_t.self, capacity: Int(count)) { rebound in
                task_info(mach_task_self_, task_flavor_t(TASK_VM_INFO), rebound, &count)
            }
        }

        guard result == KERN_SUCCESS else {
            return nil
        }
        return UInt64(info.phys_footprint)
    }

    #if os(iOS)
    /**
     * このプロセスがあとどれだけメモリを使えるか（バイト）
     *
     * キーボード拡張では数十MB程度しか返らない。上限そのものを直接は取得できないため、
     * 「使用量 + 残量」で実効上限を推定する。
     */
    public static func availableBytes() -> UInt64 {
        UInt64(os_proc_available_memory())
    }
    #endif

    /**
     * 人が読める形式の計測結果を作る
     *
     * 計測値をログへ出す用途にのみ使う。
     */
    public static func describe() -> String {
        let footprint = footprintBytes().map { String(format: "%.1fMB", Double($0) / 1_048_576) } ?? "不明"
        #if os(iOS)
        let available = String(format: "%.1fMB", Double(availableBytes()) / 1_048_576)
        return "使用量 \(footprint) / 残量 \(available)"
        #else
        return "使用量 \(footprint)"
        #endif
    }
}
