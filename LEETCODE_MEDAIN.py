def findMedianSortedArrays(nums1, nums2):
    merged = sorted(nums1 + nums2)  
    n = len(merged)
    
    print(f"THE ARRAY IS {merged} and its length is {n}")
    
    if n % 2 == 0:
        return (merged[n//2] + merged[(n//2) - 1]) / 2  
    else:
        return merged[n//2]  

nums1 = [1, 2]
nums2 = [3, 4]

print(findMedianSortedArrays(nums1, nums2))
