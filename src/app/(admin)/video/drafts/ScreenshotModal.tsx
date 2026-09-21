'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import axios from '@/utils/axios';
import { Loader2, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Required interface for the API response
interface ScreenshotApiResponse {
  success: boolean;
  data: {
    screenshot: string;
    screenshotLink: string;
  } | null;
}

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: string | null;
}

export function ScreenshotModal({ isOpen, onClose, link }: ScreenshotModalProps) {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotLink, setScreenshotLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data when the modal opens and link is present
  useEffect(() => {
    if (isOpen && link) {
      const fetchScreenshot = async () => {
        setIsLoading(true);
        try {
          // !!! UPDATE THIS ENDPOINT !!!
          const response = await axios.post<ScreenshotApiResponse>(
            `/fetch-fuckingsession-screenshot`,
            {
              link: link,
            }
          );

          if (response.data.success && response.data.data) {
            setScreenshot(response.data.data?.screenshot || null);
            setScreenshotLink(response.data.data?.screenshotLink || null);
          }
        } catch (error) {
          setScreenshot(null);
          setScreenshotLink(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchScreenshot();
    } else {
      // Clear data on close
      setScreenshot(null);
      setScreenshotLink(null);
      setIsLoading(false);
    }
  }, [isOpen, link]); // Depends on isOpen and link

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl p-0" // p-0 is correct
    >
      {/* --- ADDED --- Modal Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Screenshot View</h2>
        <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-gray-100">
          <X className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Modal Body */}
      <div className="flex max-h-[70vh] items-center justify-center overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : screenshot === null ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-gray-500">No screenshot found for this video.</p>
          </div>
        ) : (
          /* --- FIXED LAYOUT --- Removed broken grid */
          <div className="flex flex-col items-center gap-4">
            <div className="overflow-hidden rounded-lg border shadow-md">
              <img src={screenshot} alt="Video Screenshot" className="h-auto w-full object-cover" />
            </div>
            {/* --- FIXED LINK --- */}
            <Link
              href={screenshotLink || '#'}
              onClick={onClose}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              View in new tab <ExternalLink className="ml-1 inline-block h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* --- ADDED --- Modal Footer */}
      <div className="flex items-center justify-end border-t border-gray-200 p-6">
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
