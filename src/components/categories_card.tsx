import Link from "next/link";
import Image from "next/image";
import "../components/categories.css"; // Import CSS file

interface CategoryCardProps {
  category: {
    name: string;
    description: string;
    image: string;
    href: string;
  };
  index: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, index }) => {
  return (
    <Link
      href={category.href}
      className="category-card relative overflow-hidden rounded-lg"
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Blurred Image on Hover */}
      <div className="category-image absolute inset-0">
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover rounded-lg transition-all duration-300"
        />
      </div>

      {/* Text Content (No Black Background) */}
      <div className="category-content absolute inset-0 flex flex-col justify-center items-center text-white opacity-100">
        <h4 className="font-medium text-lg">{category.name}</h4>
        <p className="text-white/80 text-sm mt-2">{category.description}</p>
      </div>
    </Link>
  );
};

export default CategoryCard;
