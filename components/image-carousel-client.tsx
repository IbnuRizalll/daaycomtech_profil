'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselClientProps {
    images: string[];
}

export default function ImageCarouselClient({ images }: ImageCarouselClientProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="flex items-center justify-center bg-gray-100 rounded aspect-square">
                <p className="text-gray-500">No images available</p>
            </div>
        );
    }

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
    };

    return (
        <div className="relative bg-white rounded-lg overflow-hidden shadow-sm">
            {/* Main Image */}
            <div className="relative aspect-square bg-white flex items-center justify-center">
                <Image
                    src={images[currentIndex]}
                    alt={`Product image ${currentIndex + 1}`}
                    fill
                    className="object-contain p-8"
                    priority
                />
            </div>

            {/* Navigation Buttons */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition z-10"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition z-10"
                        aria-label="Next image"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
                    {currentIndex + 1} / {images.length}
                </div>
            )}

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="bg-gray-50 p-3 flex gap-2 overflow-x-auto">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`h-16 w-16 sm:h-20 sm:w-20 rounded border-2 transition flex-shrink-0 overflow-hidden ${index === currentIndex
                                    ? 'border-red-500'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                            aria-label={`View image ${index + 1}`}
                        >
                            <div className="relative h-full w-full">
                                <Image
                                    src={image}
                                    alt={`Thumbnail ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
