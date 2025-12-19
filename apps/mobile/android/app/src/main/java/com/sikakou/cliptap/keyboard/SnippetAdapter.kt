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

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SnippetViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_snippet, parent, false)
        return SnippetViewHolder(view, onSnippetClick, variableReplacer, variablesMap)
    }

    override fun onBindViewHolder(holder: SnippetViewHolder, position: Int) {
        holder.variablesMap = variablesMap
        holder.bind(getItem(position))
    }

    class SnippetViewHolder(
        itemView: View,
        private val onSnippetClick: (Snippet) -> Unit,
        private val variableReplacer: VariableReplacer,
        var variablesMap: Map<String, String>
    ) : RecyclerView.ViewHolder(itemView) {

        private val titleTextView: TextView = itemView.findViewById(R.id.snippetTitle)

        fun bind(snippet: Snippet) {
            // タイトルを変数置換する
            val rawTitle = snippet.title ?: "(タイトルなし)"
            val replacedTitle = variableReplacer.replace(rawTitle, variablesMap)
            titleTextView.text = replacedTitle
            itemView.setOnClickListener {
                onSnippetClick(snippet)
            }
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
