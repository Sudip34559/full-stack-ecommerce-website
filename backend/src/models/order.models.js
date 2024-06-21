import mongoose, { Schema } from "mongoose";
const orderSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    shippingStatus: {
      type: String,
      enum: ["not shipped", "shipped", "delivered"],
      default: "not shipped",
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
