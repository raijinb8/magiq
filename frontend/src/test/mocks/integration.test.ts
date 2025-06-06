/**
 * MSW統合テスト
 * ファクトリーシステムとMSWハンドラーの統合動作を確認
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mockUtils, databaseUtils } from './handlers';
import { testPresets } from './factories';

describe('MSW統合テスト', () => {
  beforeEach(() => {
    // 各テスト前にクリーンな状態にリセット
    mockUtils.resetAllData();
  });

  describe('認証システム統合', () => {
    it('ファクトリーで生成されたユーザーでログインできる', async () => {
      // Given: ファクトリーで生成されたテストユーザー
      const testUser = mockUtils.addTestUser({
        email: 'test-integration@example.com',
        user_metadata: { password: 'test123' }
      });

      // When: ログインAPIを呼び出し
      const response = await fetch('/auth/v1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'test123'
        })
      });

      // Then: 正常にログインできる
      expect(response.status).toBe(200);
      
      const authData = await response.json();
      expect(authData.user.email).toBe(testUser.email);
      expect(authData.access_token).toMatch(/^mock-access-token-/);
      
      // 認証状態が更新されている
      const authState = mockUtils.getAuthState();
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.currentUser?.email).toBe(testUser.email);
    });

    it('存在しないユーザーではログインが失敗する', async () => {
      const response = await fetch('/auth/v1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
      });

      expect(response.status).toBe(400);
      
      const errorData = await response.json();
      expect(errorData.error).toBe('Invalid login credentials');
    });

    it('新しいユーザーをサインアップできる', async () => {
      const newUserData = {
        email: 'new-user@example.com',
        password: 'securepassword123'
      };

      const response = await fetch('/auth/v1/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      });

      expect(response.status).toBe(200);
      
      const signupData = await response.json();
      expect(signupData.user.email).toBe(newUserData.email);
      expect(signupData.user.email_confirmed_at).toBeNull(); // メール確認待ち
    });
  });

  describe('PDF処理システム統合', () => {
    it('認証済みユーザーがPDFを処理できる', async () => {
      // Given: ログイン状態のユーザー
      mockUtils.loginAsUser('test@example.com');

      // PDF ファイルのモック
      const pdfFile = new File(['%PDF-1.4 テストコンテンツ'], 'test.pdf', {
        type: 'application/pdf'
      });

      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('companyId', 'NOHARA_G');

      // When: PDF処理APIを呼び出し
      const response = await fetch('/functions/v1/process-pdf-single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockUtils.getAuthState().accessToken}`
        },
        body: formData
      });

      // Then: 正常に処理される
      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.generatedText).toContain('グリーンマンション'); // NOHARA_G固有のテキスト
      expect(result.promptIdentifier).toBe('NOHARA_G_V20250605');
    });

    it('未認証ユーザーはPDF処理ができない', async () => {
      const pdfFile = new File(['%PDF-1.4 テストコンテンツ'], 'test.pdf', {
        type: 'application/pdf'
      });

      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('companyId', 'NOHARA_G');

      const response = await fetch('/functions/v1/process-pdf-single', {
        method: 'POST',
        body: formData
      });

      expect(response.status).toBe(401);
    });

    it('無効なファイルタイプは拒否される', async () => {
      mockUtils.loginAsUser('test@example.com');
      
      const textFile = new File(['テキストファイル'], 'test.txt', {
        type: 'text/plain'
      });

      const formData = new FormData();
      formData.append('file', textFile);
      formData.append('companyId', 'NOHARA_G');

      const response = await fetch('/functions/v1/process-pdf-single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockUtils.getAuthState().accessToken}`
        },
        body: formData
      });

      expect(response.status).toBe(400);
      
      const errorData = await response.json();
      expect(errorData.error).toContain('PDFファイルのみサポート');
    });
  });

  describe('データベース統合', () => {
    it('認証済みユーザーがワークオーダーを取得できる', async () => {
      // Given: ログイン状態のユーザーと関連データ
      const user = mockUtils.loginAsUser('test@example.com');
      databaseUtils.seedUserData(user!.id, { workOrderCount: 3, shiftCount: 5 });

      // When: ワークオーダー取得APIを呼び出し
      const response = await fetch(`/rest/v1/work_orders?user_id=${user!.id}`, {
        headers: {
          'Authorization': `Bearer ${mockUtils.getAuthState().accessToken}`
        }
      });

      // Then: ユーザーのワークオーダーが取得される
      expect(response.status).toBe(200);
      
      const workOrders = await response.json();
      expect(workOrders.length).toBeGreaterThan(0);
      workOrders.forEach((wo: { user_id: string }) => {
        expect(wo.user_id).toBe(user!.id);
      });
    });

    it('新しいワークオーダーを作成できる', async () => {
      const user = mockUtils.loginAsUser('admin@example.com');
      
      const newWorkOrderData = {
        file_name: 'integration-test.pdf',
        company_name: '野原G住環境',
        status: 'pending'
      };

      const response = await fetch('/rest/v1/work_orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockUtils.getAuthState().accessToken}`
        },
        body: JSON.stringify(newWorkOrderData)
      });

      expect(response.status).toBe(201);
      
      const createdWorkOrder = await response.json();
      expect(createdWorkOrder.file_name).toBe(newWorkOrderData.file_name);
      expect(createdWorkOrder.user_id).toBe(user!.id);
      expect(createdWorkOrder.id).toBeDefined();
    });

    it('シフトデータのCRUD操作が動作する', async () => {
      mockUtils.loginAsUser('manager@nohara.com');
      
      // Create - シフト作成
      const newShiftData = {
        date: '2025-06-10',
        shift_type: 'morning',
        note: '統合テスト用シフト'
      };

      const createResponse = await fetch('/rest/v1/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockUtils.getAuthState().accessToken}`
        },
        body: JSON.stringify(newShiftData)
      });

      expect(createResponse.status).toBe(201);
      const createdShift = await createResponse.json();

      // Read - シフト取得
      const readResponse = await fetch('/rest/v1/shifts', {
        headers: {
          'Authorization': `Bearer ${mockUtils.getAuthState().accessToken}`
        }
      });

      expect(readResponse.status).toBe(200);
      const shifts = await readResponse.json();
      const foundShift = shifts.find((s: { id: number }) => s.id === createdShift.id);
      expect(foundShift).toBeDefined();
      expect(foundShift.note).toBe(newShiftData.note);
    });
  });

  describe('ストレージ統合', () => {
    it('ファイルのアップロード・ダウンロード・削除が動作する', async () => {
      mockUtils.loginAsUser('staff@katoubeniya.com');
      const authToken = mockUtils.getAuthState().accessToken;

      // Upload
      const testFile = new File(['テストファイル内容'], 'test-upload.pdf', {
        type: 'application/pdf'
      });

      const formData = new FormData();
      formData.append('file', testFile);

      const uploadResponse = await fetch('/storage/v1/object/work-orders/test-upload.pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      expect(uploadResponse.status).toBe(200);
      const uploadResult = await uploadResponse.json();
      expect(uploadResult.path).toBe('test-upload.pdf');

      // Download
      const downloadResponse = await fetch('/storage/v1/object/work-orders/test-upload.pdf', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(downloadResponse.status).toBe(200);
      expect(downloadResponse.headers.get('Content-Type')).toBe('application/pdf');

      // Delete
      const deleteResponse = await fetch('/storage/v1/object/work-orders/test-upload.pdf', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(deleteResponse.status).toBe(200);

      // 削除後のダウンロード試行（404になるはず）
      const notFoundResponse = await fetch('/storage/v1/object/work-orders/test-upload.pdf');
      expect(notFoundResponse.status).toBe(404);
    });
  });

  describe('テストシナリオ統合', () => {
    it('populatedシナリオでデータが適切に生成される', () => {
      // Given: populatedシナリオをセットアップ
      mockUtils.setupScenario('populated');

      // When: データの状況を確認
      const dataCounts = databaseUtils.getDataCounts();

      // Then: 適切なデータが生成されている
      expect(dataCounts.users).toBeGreaterThan(4); // 基本ユーザー + activeユーザー
      expect(dataCounts.workOrders).toBeGreaterThan(10); // 基本データ + seeded data
      expect(dataCounts.shifts).toBeGreaterThan(20);
    });

    it('error-proneシナリオでエラー状態のデータが生成される', () => {
      mockUtils.setupScenario('error-prone');

      const currentData = databaseUtils.getCurrentData();
      const errorWorkOrders = currentData.workOrders.filter(wo => wo.status === 'error');
      
      expect(errorWorkOrders.length).toBeGreaterThan(0);
      errorWorkOrders.forEach(wo => {
        expect(wo.error_message).toContain('テスト用エラー');
      });
    });

    it('cleanシナリオで最小限のデータ状態になる', () => {
      // 最初にデータを増やす
      mockUtils.setupScenario('populated');
      expect(databaseUtils.getDataCounts().workOrders).toBeGreaterThan(5);

      // cleanシナリオに切り替え
      mockUtils.setupScenario('clean');

      const dataCounts = databaseUtils.getDataCounts();
      // 基本的な初期データのみ（5件程度）
      expect(dataCounts.workOrders).toBeLessThan(10);
      expect(dataCounts.users).toBe(4); // 基本の4ユーザー
    });
  });

  describe('テストプリセット統合', () => {
    it('testPresetsがMSWハンドラーと連携する', async () => {
      // Given: 企業別データプリセット
      const companyData = testPresets.companySpecificData();
      
      // MSWを通して各企業のデータを確認
      for (const [companyKey, workOrder] of Object.entries(companyData)) {
        // ワークオーダーがファクトリーで正しく生成されていることを確認
        expect(workOrder.company_name).toBeTruthy();
        expect(workOrder.generated_text).toBeTruthy();
        expect(workOrder.prompt_identifier).toMatch(/V20250605$/);
        
        // 企業固有のテキストが含まれることを確認
        if (companyKey === 'noharaG') {
          expect(workOrder.generated_text).toContain('グリーンマンション');
        } else if (companyKey === 'katoubeniya') {
          expect(workOrder.generated_text).toContain('池袋新築現場');
        }
      }
    });

    it('problematicUserプリセットがエラー状態を正しく生成する', () => {
      const problematicData = testPresets.problematicUser();
      
      expect(problematicData.user).toBeDefined();
      expect(problematicData.workOrders.length).toBeGreaterThan(0);
      
      problematicData.workOrders.forEach(wo => {
        expect(wo.status).toBe('error');
        expect(wo.user_id).toBe(problematicData.user.id);
      });
      
      problematicData.shifts.forEach(shift => {
        expect(shift.status).toBe('cancelled');
        expect(shift.user_id).toBe(problematicData.user.id);
      });
    });
  });

  describe('データ整合性確認', () => {
    it('ファクトリーで生成されたデータがMSWレスポンスと一致する', async () => {
      const user = mockUtils.loginAsUser('test@example.com');
      databaseUtils.addMockWorkOrder({
        user_id: user!.id,
        file_name: 'consistency-test.pdf',
        company_name: '野原G住環境',
        status: 'completed'
      });

      const response = await fetch(`/rest/v1/work_orders?user_id=${user!.id}`, {
        headers: {
          'Authorization': `Bearer ${mockUtils.getAuthState().accessToken}`
        }
      });

      const workOrders = await response.json();
      const testWorkOrder = workOrders.find((wo: { file_name: string }) => wo.file_name === 'consistency-test.pdf');
      
      expect(testWorkOrder).toBeDefined();
      expect(testWorkOrder.company_name).toBe('野原G住環境');
      expect(testWorkOrder.user_id).toBe(user!.id);
    });

    it('モックユーティリティでの状態変更がAPIレスポンスに反映される', async () => {
      // ログイン前の状態
      let response = await fetch('/auth/v1/user');
      expect(response.status).toBe(401);

      // ログイン状態に変更
      const user = mockUtils.loginAsUser('admin@example.com');
      const authState = mockUtils.getAuthState();

      // ログイン後の状態
      response = await fetch('/auth/v1/user', {
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`
        }
      });

      expect(response.status).toBe(200);
      const userData = await response.json();
      expect(userData.email).toBe(user!.email);
    });
  });
});