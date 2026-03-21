import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

const ProfilePage = () => {
  const { user } = useUser();

  const handlePayment = async () => {
    if (!user) {
      alert("Login required");
      return;
    }

    try {
      // 1️⃣ Create order from backend
      const { data: order } = await axiosInstance.post(
        "/payment/create-order"
      );

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "YouTube Clone",
        description: "Premium Upgrade",
        order_id: order.id,

        handler: async function (response: any) {
          // 2️⃣ Verify payment
          await axiosInstance.post("/payment/verify", {
            ...response,
            userId: user._id,
          });

          alert("🎉 Premium Activated!");
          window.location.reload();
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      alert("Payment failed");
    }
  };

  return (
    <div>
      <h1>Profile</h1>

      {user?.isPremium ? (
        <p>🌟 You are Premium User</p>
      ) : (
        <button onClick={handlePayment}>
          Upgrade to Premium
        </button>
      )}
    </div>
  );
};

export default ProfilePage;


