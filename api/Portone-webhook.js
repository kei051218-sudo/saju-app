// api/portone-webhook.js
// Vercel Serverless Function - 포트원 웹훅 수신

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const body = req.body;
    const { type, data } = body;

    console.log('웹훅 수신:', type, data);

    // 결제 완료
    if (type === 'Transaction.Paid') {
      const { paymentId } = data;
      console.log(`결제 완료: ${paymentId}`);
      // TODO: DB에 결제 기록 저장 (현재는 로그만)
    }

    // 결제 취소
    if (type === 'Transaction.Cancelled' || type === 'Transaction.PartialCancelled') {
      const { paymentId, cancellationId } = data;
      console.log(`결제 취소: ${paymentId}, 취소ID: ${cancellationId}`);
      // TODO: DB에 취소 기록 저장
    }

    // 결제 실패
    if (type === 'Transaction.Failed') {
      const { paymentId } = data;
      console.log(`결제 실패: ${paymentId}`);
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    return res.status(400).json({ ok: false });
  }
}
