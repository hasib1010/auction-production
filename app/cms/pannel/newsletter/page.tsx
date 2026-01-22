"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/fetcher";
import toast from "react-hot-toast";
import axios from "axios";
import { Plus, Trash2 } from "lucide-react";
import PremiumLoader from "@/components/shared/PremiumLoader";
import Image from "next/image";

interface NewsletterStats {
  totalSubscribers: number;
  totalUsers: number;
  subscriptionRate: string;
}

interface Auction {
  id: string;
  name: string;
  slug: string;
  status: string;
  startDate?: string;
}

export default function NewsletterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [newsletterType, setNewsletterType] = useState<
    "upcoming_auction" | "general_news"
  >("upcoming_auction");

  // Form state
  const [selectedAuctionId, setSelectedAuctionId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [readMoreUrl, setReadMoreUrl] = useState("");

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStats();
    fetchAuctions();
  }, []);

  const fetchStats = async () => {
    try {
      const response =
        await apiClient.get<NewsletterStats>("/newsletter/stats");
      setStats(response);
    } catch (error) {
      console.error("Error fetching newsletter stats:", error);
      toast.error("Failed to load newsletter statistics", {
        duration: 4000,
      });
    }
  };

  const fetchAuctions = async () => {
    try {
      const response = await apiClient.get<Auction[]>("/auction");
      // Filter for upcoming or live auctions
      const upcomingAuctions = response.filter(
        (auction: Auction) =>
          auction.status === "Upcoming" || auction.status === "Live",
      );
      setAuctions(upcomingAuctions);
    } catch (error) {
      console.error("Error fetching auctions:", error);
      toast.error("Failed to load auctions", {
        duration: 4000,
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const toastId = toast.loading(`Uploading ${files.length} image(s)...`);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "upload_preset",
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
        );

        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!}/image/upload`,
          formData,
        );
        return res.data.secure_url;
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedImages((prev) => [...prev, ...urls]);

      toast.success(`${files.length} image(s) uploaded successfully!`, {
        id: toastId,
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images", { id: toastId });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
    toast.success("Image removed", { duration: 2000 });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newsletterType === "upcoming_auction" && !selectedAuctionId) {
      toast.error("Please select an auction", {
        duration: 3000,
      });
      return;
    }

    if (
      newsletterType === "general_news" &&
      (!subject.trim() || !content.trim())
    ) {
      toast.error("Subject and content are required for general news", {
        duration: 3000,
      });
      return;
    }

    if (!stats || stats.totalSubscribers === 0) {
      toast.error("No subscribers found", {
        duration: 3000,
      });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to send this newsletter to ${stats.totalSubscribers} subscribers?`,
      )
    ) {
      return;
    }

    try {
      setSending(true);

      const payload: any = {
        type: newsletterType,
      };

      if (newsletterType === "upcoming_auction") {
        payload.auctionId = selectedAuctionId;
        if (uploadedImages.length > 0) {
          payload.imageUrl = uploadedImages[0]; // Primary image
          payload.imageUrls = uploadedImages; // All images
        }
      } else {
        payload.subject = subject.trim();
        payload.content = content.trim();
        if (uploadedImages.length > 0) {
          payload.imageUrl = uploadedImages[0]; // Primary image
          payload.imageUrls = uploadedImages; // All images
        }
        if (readMoreUrl.trim()) payload.readMoreUrl = readMoreUrl.trim();
      }

      const response = await apiClient.post<{
        success: boolean;
        message: string;
        emailsSent: number;
        emailsFailed: number;
        totalSubscribers: number;
        errors?: string[];
      }>("/newsletter/send", payload);

      toast.success(
        `Newsletter sent successfully! ${response.emailsSent} emails sent.${response.emailsFailed > 0 ? ` ${response.emailsFailed} failed.` : ""}`,
        { duration: 6000 },
      );

      // Reset form
      setSelectedAuctionId("");
      setSubject("");
      setContent("");
      setImageUrl("");
      setUploadedImages([]); // Reset uploaded images
      setReadMoreUrl("");

      // Refresh stats
      await fetchStats();
    } catch (error: any) {
      console.error("Error sending newsletter:", error);
      toast.error(error?.response?.data?.error || "Failed to send newsletter", {
        duration: 4000,
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <PremiumLoader text="Loading newsletter page..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Newsletter Management
          </h1>
          <p className="text-gray-600">
            Send newsletters and upcoming auction notifications to subscribed
            users
          </p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Subscribers</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalSubscribers}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Subscription Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.subscriptionRate}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Newsletter Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Send Newsletter
          </h2>

          <form onSubmit={handleSend} className="space-y-6">
            {/* Newsletter Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Newsletter Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="newsletterType"
                    value="upcoming_auction"
                    checked={newsletterType === "upcoming_auction"}
                    onChange={(e) =>
                      setNewsletterType(e.target.value as "upcoming_auction")
                    }
                    className="mr-2"
                  />
                  <span>Upcoming Auction</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="newsletterType"
                    value="general_news"
                    checked={newsletterType === "general_news"}
                    onChange={(e) =>
                      setNewsletterType(e.target.value as "general_news")
                    }
                    className="mr-2"
                  />
                  <span>General News</span>
                </label>
              </div>
            </div>

            {/* Upcoming Auction Fields */}
            {newsletterType === "upcoming_auction" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Auction *
                  </label>
                  <select
                    value={selectedAuctionId}
                    onChange={(e) => setSelectedAuctionId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="">Select an auction...</option>
                    {auctions.map((auction) => (
                      <option key={auction.id} value={auction.id}>
                        {auction.name} ({auction.status})
                      </option>
                    ))}
                  </select>
                  {auctions.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No upcoming auctions found
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Images (Optional)
                  </label>

                  {/* Image Upload Area */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                      {uploadedImages.map((url, index) => (
                        <div key={index} className="relative group w-32 h-32">
                          <div className="w-full h-full rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50 relative">
                            <Image
                              src={url}
                              alt={`Newsletter image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        {uploadingImage ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
                        ) : (
                          <>
                            <div className="p-2 rounded-full bg-gray-100 group-hover:bg-purple-100 transition-colors">
                              <Plus className="w-5 h-5 text-gray-400 group-hover:text-purple-500" />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">
                              Add Image
                            </span>
                          </>
                        )}
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />

                    <p className="text-xs text-gray-500">
                      Upload one or more images. Supported formats: JPG, PNG,
                      WEBP.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* General News Fields */}
            {newsletterType === "general_news" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Newsletter Subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your newsletter content here..."
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Images (Optional)
                  </label>

                  {/* Image Upload Area */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                      {uploadedImages.map((url, index) => (
                        <div key={index} className="relative group w-32 h-32">
                          <div className="w-full h-full rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50 relative">
                            <Image
                              src={url}
                              alt={`Newsletter image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        {uploadingImage ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
                        ) : (
                          <>
                            <div className="p-2 rounded-full bg-gray-100 group-hover:bg-purple-100 transition-colors">
                              <Plus className="w-5 h-5 text-gray-400 group-hover:text-purple-500" />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">
                              Add Image
                            </span>
                          </>
                        )}
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />

                    <p className="text-xs text-gray-500">
                      Upload one or more images. Supported formats: JPG, PNG,
                      WEBP.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Read More URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={readMoreUrl}
                    onChange={(e) => setReadMoreUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || (stats?.totalSubscribers || 0) === 0}
                className="px-6 py-2 bg-gradient-to-r from-[#E253FF] to-[#9F13FB] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending
                  ? "Sending..."
                  : `Send to ${stats?.totalSubscribers || 0} Subscribers`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
