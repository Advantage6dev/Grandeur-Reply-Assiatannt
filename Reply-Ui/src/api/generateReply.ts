export type ReplyResult = {
  reply: string;
  itemsFound: number;
  total: number;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// PLACEHOLDER: returns a fixed sample reply so you can build and test the UI.
// Later, replace the body of this function with a fetch() to your Node backend,
// which will call the open-source model and return the same { reply, itemsFound, total } shape.
export async function generateReply(_message: string): Promise<ReplyResult> {
  await wait(900);

  return {
    reply: `Hello! Thanks for reaching out. Here are your details:

Jollof rice tray x1: ₦15,000
Blue waist bead x1: ₦2,500
Delivery to Bodija: ₦1,500

Total: ₦19,000

Delivery is tomorrow between 12pm and 4pm. Payment is to Grandeur's Treats & Beads (demo account). Please send your receipt to confirm.`,
    itemsFound: 2,
    total: 19000,
  };
}
