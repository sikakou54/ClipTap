package com.sikakou.cliptap.keyboard

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.sikakou.cliptap.R
import com.sikakou.cliptap.models.ShortcutValue

/**
 * ショートカット値の一覧を表示するRecyclerView用アダプター
 *
 * 【値名と値を両方出す理由】
 * 挿入されるのは値だけなので、選ぶ前に何が入力されるかを確かめられるようにする。
 * 値名（例: 母）だけでは、どの文字列が入るのか分からない。
 */
class ShortcutValueAdapter(
    private val onValueClick: (ShortcutValue) -> Unit
) : ListAdapter<ShortcutValue, ShortcutValueAdapter.ShortcutValueViewHolder>(ShortcutValueDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ShortcutValueViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_shortcut_value, parent, false)
        return ShortcutValueViewHolder(view, onValueClick)
    }

    override fun onBindViewHolder(holder: ShortcutValueViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ShortcutValueViewHolder(
        itemView: View,
        private val onValueClick: (ShortcutValue) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {

        private val nameTextView: TextView = itemView.findViewById(R.id.shortcutValueName)
        private val valueTextView: TextView = itemView.findViewById(R.id.shortcutValueContent)

        /** 現在この行が表示しているショートカット値 */
        private var currentValue: ShortcutValue? = null

        init {
            /* 行全体を1つのタッチ対象として扱う。
               バインドのたびにリスナーを作り直すとスクロール中に無駄なオブジェクトを生成するため、
               生成時に1回だけ設定して表示中の値を参照する */
            itemView.setOnClickListener {
                currentValue?.let(onValueClick)
            }
        }

        fun bind(value: ShortcutValue) {
            currentValue = value
            nameTextView.text = value.name
            valueTextView.text = value.value
        }
    }

    private class ShortcutValueDiffCallback : DiffUtil.ItemCallback<ShortcutValue>() {
        override fun areItemsTheSame(oldItem: ShortcutValue, newItem: ShortcutValue): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: ShortcutValue, newItem: ShortcutValue): Boolean {
            return oldItem == newItem
        }
    }
}
