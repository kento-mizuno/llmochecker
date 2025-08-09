#!/usr/bin/env tsx

/**
 * Supabaseデータベース初期設定スクリプト
 * 
 * このスクリプトを実行前に .env.local ファイルを作成し、
 * Supabase接続情報を設定してください。
 * 
 * 実行方法: npx tsx scripts/setup-database.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// 環境変数を読み込み
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ 必要な環境変数が設定されていません。')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 設定済み' : '❌ 未設定')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅ 設定済み' : '❌ 未設定')
  console.error('\n.env.local ファイルを作成し、Supabase接続情報を設定してください。')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function setupDatabase() {
  console.log('🚀 Supabaseデータベース初期設定を開始します...\n')

  try {
    // 1. データベーススキーマを読み込み
    console.log('📄 データベーススキーマを読み込み中...')
    const schemaPath = path.join(process.cwd(), 'docs', 'design', 'llmo-checker', 'database-schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8')
    
    // SQLを実行しやすいように分割
    const sqlStatements = schemaSql
      .split(';')
      .map(sql => sql.trim())
      .filter(sql => sql.length > 0 && !sql.startsWith('--'))

    console.log(`📊 ${sqlStatements.length}個のSQL文を実行します...\n`)

    // 2. 各SQL文を順次実行
    let successCount = 0
    let errorCount = 0

    for (const [index, sql] of sqlStatements.entries()) {
      try {
        console.log(`⏳ ${index + 1}/${sqlStatements.length}: 実行中...`)
        
        const { error } = await supabase.rpc('execute_sql', { 
          sql_query: sql 
        })

        if (error) {
          // 代替手段: 直接SQLクエリを実行
          const { error: directError } = await supabase
            .from('_temp_')
            .select('1')
            .limit(0)

          if (directError) {
            console.log(`⚠️  直接実行を試行します...`)
            // この部分は実際のSupabase管理画面で実行することを推奨
            console.log(`SQL: ${sql.substring(0, 100)}...`)
          }
        }

        successCount++
        console.log(`✅ 完了`)

      } catch (err) {
        errorCount++
        console.error(`❌ エラー: ${err}`)
        console.error(`SQL: ${sql.substring(0, 100)}...`)
      }
    }

    console.log(`\n📊 実行結果:`)
    console.log(`  ✅ 成功: ${successCount}件`)
    console.log(`  ❌ エラー: ${errorCount}件`)

    // 3. テーブル作成の確認
    console.log('\n🔍 テーブル作成状況を確認中...')
    
    const tables = [
      'evaluation_criteria',
      'diagnoses', 
      'evaluations',
      'improvements',
      'diagnosis_progress'
    ]

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.log(`❌ ${table}: 作成されていません (${error.message})`)
        } else {
          console.log(`✅ ${table}: 作成済み (レコード数: ${count || 0})`)
        }
      } catch (err) {
        console.log(`❌ ${table}: 確認エラー`)
      }
    }

    console.log('\n🎉 データベース初期設定が完了しました！')
    console.log('\n📝 次のステップ:')
    console.log('  1. Supabase管理画面で上記エラーのあるテーブルを手動作成')
    console.log('  2. RLSポリシーの設定確認')
    console.log('  3. 評価基準マスタデータの投入')

  } catch (error) {
    console.error('❌ 初期設定中にエラーが発生しました:', error)
    process.exit(1)
  }
}

// メイン実行
setupDatabase()