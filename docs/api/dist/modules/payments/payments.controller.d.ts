import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { UserRole } from '@apna-ghar/shared-types';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createOrder(studentId: string, dto: CreatePaymentOrderDto): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").PaymentOrderResponse;
    }>;
    verifyPayment(studentId: string, dto: VerifyPaymentDto): Promise<{
        success: boolean;
        data: {
            success: boolean;
            payment: import("./schemas/payment.schema").PaymentDocument;
            bookingReference: string;
        };
    }>;
    simulatePayment(studentId: string, orderId: string, method?: 'UPI' | 'NETBANKING' | 'CARD' | 'SIMULATOR'): Promise<{
        success: boolean;
        data: {
            success: boolean;
            payment: import("./schemas/payment.schema").PaymentDocument;
            bookingReference: string;
        };
    }>;
    handleWebhook(signature: string, payload: Record<string, unknown>): Promise<{
        success: boolean;
        data: {
            status: string;
        };
    }>;
    getReceipt(bookingId: string, userId: string, role: UserRole): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").PaymentReceipt;
    }>;
}
//# sourceMappingURL=payments.controller.d.ts.map