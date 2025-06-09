import { OrderTrackingClient } from "../../../components/orders/order-tracking-client";

export type paramsType = Promise<{ id: string }>;

export default async function OrderPage(props: { params: paramsType }) {
  const { id } = await props.params;
  
  return <OrderTrackingClient orderId={id} />;
}
export const runtime = 'edge';
