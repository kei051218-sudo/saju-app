// api/verify-payment.js
// Vercel Serverless Function - 포트원 결제 검증

export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { paymentId, amount } = req.body;

  if (!paymentId || !amount) {
    return res.status(400).json({ success: false, message: '필수 파라미터 누락' });
  }

  const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;
  if (!PORTONE_API_SECRET) {
    console.error('PORTONE_API_SECRET 환경변수가 설정되지 않았습니다.');
    return res.status(500).json({ success: false, message: '서버 설정 오류' });
  }

  try {
    // 포트원 API로 결제 건 조회
    const paymentRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `PortOne ${PORTONE_API_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    if (!paymentRes.ok) {
      console.error('포트원 결제 조회 실패:', paymentRes.status);
      return res.status(400).json({ success: false, message: '결제 정보를 조회할 수 없습니다.' });
    }

    const payment = await paymentRes.json();

    // 결제 상태 확인
    if (payment.status !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: `결제 상태 오류: ${payment.status}`,
      });
    }

    // 결제 금액 검증 (위변조 방지)
    if (payment.amount.total !== amount) {
      console.error(`금액 불일치: 요청=${amount}, 실제=${payment.amount.total}`);
      return res.status(400).json({
        success: false,
        message: '결제 금액이 일치하지 않습니다.',
      });
    }

    // 검증 성공
    return res.status(200).json({
      success: true,
      paymentId: payment.id,
      amount: payment.amount.total,
      status: payment.status,
    });

  } catch (error) {
    console.error('결제 검증 오류:', error);
    return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
}
