"use client";

//services
import Image from "next/image";

export default function ProjectGallery() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Ảnh chính lớn */}
      <div className="md:col-span-2 aspect-video rounded-xl overflow-hidden relative group">
        <Image
          src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"
          alt="Toàn cảnh dự án"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
          <p className="text-white font-medium">
            Toàn cảnh khu đô thị biển phía Đông
          </p>
        </div>
      </div>

      {/* 2 ảnh phụ bên phải */}
      <div className="grid grid-rows-2 gap-4">
        <div className="rounded-xl overflow-hidden relative group">
          <Image
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80"
            alt="Tiện ích"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-small font-semibold">
              Xem thêm 12 ảnh
            </span>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden relative">
          <Image
            src="https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80"
            alt="Nội thất"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
