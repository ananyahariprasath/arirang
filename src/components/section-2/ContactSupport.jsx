import { useState } from "react";
import { useToast } from "../../context/ToastContext";

function ContactSupport({ isInsideDrawer = false }) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    socialMedia: "",
    id: "",
    query: "",
  });

  const socialMediaOptions = [
    "X (Twitter)",
    "Instagram",
    "Weverse",
    "Facebook",
    "Telegram",
    "TikTok",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.socialMedia || !formData.id || !formData.query) {
      toast.show("Please fill in all fields", "error");
      return;
    }

    // Create new ticket object
    const newTicket = {
      id: Date.now(), // Simple unique ID
      socialMedia: formData.socialMedia,
      userId: formData.id,
      query: formData.query,
      status: "Open",
      timestamp: new Date().toLocaleString(),
    };

    // Get existing tickets from localStorage
    const existingTickets = JSON.parse(localStorage.getItem("supportTickets") || "[]");

    // Add new ticket
    const updatedTickets = [newTicket, ...existingTickets];

    // Save back to localStorage
    localStorage.setItem("supportTickets", JSON.stringify(updatedTickets));

    toast.show("Support request submitted! 💜", "success");
    
    // Reset form
    setFormData({
      socialMedia: "",
      id: "",
      query: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className={isInsideDrawer ? "" : "sticky top-28"}>

      <div className="bg-[var(--card-bg)]/40
                      backdrop-blur-xl
                      border border-[var(--accent)]/40
                      rounded-3xl
                      p-5 shadow-2xl">

        <h3 className="text-lg font-bold mb-4 text-center">
          Contact Support
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">

          {/* Social Media Dropdown */}
          <select
            name="socialMedia"
            value={formData.socialMedia}
            onChange={handleChange}
            className="w-full py-3 px-4 rounded-xl border border-[var(--accent)]/50 
                       bg-[var(--card-bg)]/20 backdrop-blur-sm
                       text-[var(--text-primary)] 
                       focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--card-bg)]/30
                       transition-all duration-300 cursor-pointer"
          >
            <option value="" disabled className="bg-[var(--card-bg)] text-[var(--text-primary)]">Select Social Media Platform</option>
            {socialMediaOptions.map((platform) => (
              <option key={platform} value={platform} className="bg-[var(--card-bg)] text-[var(--text-primary)]">
                {platform}
              </option>
            ))}
          </select>

          {/* ID Input */}
          <input
            type="text"
            name="id"
            value={formData.id}
            onChange={handleChange}
            placeholder="ID"
            className="w-full py-3 px-4 rounded-xl border border-[var(--accent)]/50 
                       bg-[var(--card-bg)]/20 backdrop-blur-sm
                       text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50
                       focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--card-bg)]/30
                       transition-all duration-300"
          />

          {/* Query Textarea */}
          <textarea
            name="query"
            value={formData.query}
            onChange={handleChange}
            placeholder="Query"
            rows="3"
            className="w-full py-3 px-4 rounded-xl border border-[var(--accent)]/50 
                       bg-[var(--card-bg)]/20 backdrop-blur-sm
                       text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50
                       focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--card-bg)]/30
                       transition-all duration-300 resize-none"
          ></textarea>

          {/* Submit Button */}
          <button 
            type="submit"
            className="w-full py-3 rounded-xl border-2 border-[var(--text-primary)] 
                       hover:bg-[var(--accent)] hover:text-black hover:border-[var(--accent)]
                       font-semibold transition-all duration-300"
          >
            SUBMIT
          </button>

          <p className="text-[10px] italic text-center opacity-60 leading-relaxed mt-2">
            *If you are not able to reach us through this form, you can contact us directly through our socials given in the Help Desk.
          </p>

        </form>

      </div>

    </div>
  );
}

export default ContactSupport;

