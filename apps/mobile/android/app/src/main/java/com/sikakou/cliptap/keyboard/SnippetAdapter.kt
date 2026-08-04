package com.sikakou.cliptap.keyboard

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.sikakou.cliptap.R
import com.sikakou.cliptap.models.Snippet
import com.sikakou.cliptap.utils.VariableReplacer

/**
 * スニペット一覧を表示するRecyclerView用アダプター
 */
class SnippetAdapter(
    private val onSnippetClick: (Snippet) -> Unit
) : ListAdapter<Snippet, SnippetAdapter.SnippetViewHolder>(SnippetDiffCallback()) {

    private val variableReplacer = VariableReplacer()
    var variablesMap: Map<String, String> = emptyMap()

    /**
     * システム変数の出力書式
     *
     * 行の描画ごとにDBから読み直すとスクロール中にUIスレッドでSQLiteへアクセスすることになり
     * フレーム落ちの原因になるため、一覧の読み込み時に設定した値を使い回す
     */
    var systemVariableFormats: Map<String, String> = emptyMap()

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SnippetViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_snippet, parent, false)
        return SnippetViewHolder(view, onSnippetClick, variableReplacer, variablesMap, systemVariableFormats)
    }

    override fun onBindViewHolder(holder: SnippetViewHolder, position: Int) {
        holder.variablesMap = variablesMap
        holder.systemVariableFormats = systemVariableFormats
        holder.bind(getItem(position))
    }

    class SnippetViewHolder(
        itemView: View,
        private val onSnippetClick: (Snippet) -> Unit,
        private val variableReplacer: VariableReplacer,
        var variablesMap: Map<String, String>,
        var systemVariableFormats: Map<String, String>
    ) : RecyclerView.ViewHolder(itemView) {

        private val titleTextView: TextView = itemView.findViewById(R.id.snippetTitle)

        /** 現在この行が表示しているスニペット */
        private var currentSnippet: Snippet? = null

        init {
            /* 行全体を1つのタッチ対象として扱う。
               バインドのたびにリスナーを作り直すとスクロール中に無駄なオブジェクトを生成するため、
               生成時に1回だけ設定して表示中のスニペットを参照する */
            itemView.setOnClickListener {
                currentSnippet?.let(onSnippetClick)
            }
        }

        fun bind(snippet: Snippet) {
            currentSnippet = snippet

            // タイトルを変数置換する
            val rawTitle = snippet.title ?: itemView.context.getString(R.string.snippet_no_title)
            val replacedTitle = variableReplacer.replace(rawTitle, variablesMap, systemVariableFormats)
            titleTextView.text = replacedTitle
        }
    }

    private class SnippetDiffCallback : DiffUtil.ItemCallback<Snippet>() {
        override fun areItemsTheSame(oldItem: Snippet, newItem: Snippet): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Snippet, newItem: Snippet): Boolean {
            return oldItem == newItem
        }
    }
}
