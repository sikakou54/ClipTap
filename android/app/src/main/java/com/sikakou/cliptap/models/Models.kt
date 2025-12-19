package com.sikakou.cliptap.models

/**
 * プロファイル（環境）
 */
data class Profile(
    val id: String,
    val name: String,
    val isActive: Boolean,
    val isDefault: Boolean,
    val valid: Boolean,
    val sortOrder: Int,
    val createdAt: String,
    val updatedAt: String
)

/**
 * カテゴリ
 */
data class Category(
    val id: String,
    val name: String,
    val color: String?,
    val sortOrder: Int,
    val createdAt: String
)

/**
 * スニペット
 */
data class Snippet(
    val id: String,
    val title: String?,
    val content: String,
    val categoryId: String?,
    val copyWithTitle: Boolean,
    val createdAt: String,
    val updatedAt: String
)

/**
 * 変数
 */
data class Variable(
    val id: String,
    val name: String,
    val type: String,
    val defaultValue: String?,
    val valid: Boolean,
    val sortOrder: Int,
    val createdAt: String,
    val updatedAt: String
)

/**
 * プロファイル変数
 */
data class ProfileVariable(
    val profileId: String,
    val variableId: String,
    val value: String
)
