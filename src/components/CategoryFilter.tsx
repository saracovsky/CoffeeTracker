import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* "All" button */}
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === null && styles.selectedButton
          ]}
          onPress={() => onSelectCategory(null)}
          testID="category-filter-all"
        >
          <Text style={[
            styles.categoryText,
            selectedCategory === null && styles.selectedText
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        {/* Category buttons */}
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedButton
            ]}
            onPress={() => onSelectCategory(category)}
            testID={`category-filter-${category}`}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.selectedText
            ]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedButton: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedText: {
    color: 'white',
  },
});