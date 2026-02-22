'use client';

import { useState } from 'react';

interface ImageCarouselProps {
    images: string[];
    onRemove?: (index: number) => void;
    isEditing?: boolean;
}

export default function ImageCarousel({ images, onRemove, isEditing }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="flex items-center justify-center bg-gray-100 rounded h-48 sm:h-56 lg:h-64 w-full">
                <p className="text-gray-500">No images</p>
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
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            {/* Main Image */}
            <div className="h-48 sm:h-56 lg:h-64 w-full flex items-center justify-center bg-gray-100">
                <img
                    src={images[currentIndex]}
                    alt={`Product image ${currentIndex + 1}`}
                    className="max-h-full max-w-full object-contain"
                />
            </div>

            {/* Navigation Buttons */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition"
                    >
                        ❮
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition"
                    >
                        ❯
                    </button>
                </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
                {currentIndex + 1} / {images.length}
            </div>

            {/* Thumbnails */}
            <div className="bg-gray-800 p-2 flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                    <div
                        key={index}
                        className="relative flex-shrink-0"
                    >
                        <button
                            onClick={() => setCurrentIndex(index)}
                            className={`h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded border-2 transition overflow-hidden ${index === currentIndex
                                    ? 'border-red-500'
                                    : 'border-gray-600 hover:border-gray-400'
                                }`}
                        >
                            <img
                                src={image}
                                alt={`Thumbnail ${index + 1}`}
                                className="h-full w-full object-cover"
                            />
                        </button>
                        {isEditing && onRemove && (
                            <button
                                onClick={() => onRemove(index)}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
