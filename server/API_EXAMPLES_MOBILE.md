# 📱 Ejemplos Prácticos de Uso de la API - App Móvil

Este documento contiene ejemplos prácticos y completos de cómo usar la API de promociones desde diferentes plataformas móviles.

---

## 🚀 React Native

### Configuración Inicial

```javascript
// config/api.js
const API_CONFIG = {
  baseURL: __DEV__ 
    ? 'http://localhost:3000/api/promotions'
    : 'https://api.link4deal.com/api/promotions',
  
  timeout: 30000, // 30 segundos
};

export default API_CONFIG;
```

### Servicio de Promociones

```javascript
// services/PromotionsService.js
import API_CONFIG from '../config/api';
import { Platform } from 'react-native';

class PromotionsService {
  async request(endpoint, options = {}) {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la solicitud');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Obtener todas las promociones
  async getAllPromotions(filters = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key].toString());
      }
    });
    
    const queryString = params.toString();
    return this.request(queryString ? `?${queryString}` : '');
  }

  // Obtener promoción por ID
  async getPromotionById(id) {
    return this.request(`/${id}`);
  }

  // Obtener historial de precios
  async getPriceHistory(id) {
    return this.request(`/${id}/history`);
  }

  // Crear promoción con imágenes
  async createPromotion(promotionData, imageUris) {
    const formData = new FormData();
    
    // Agregar campos de texto
    Object.keys(promotionData).forEach(key => {
      if (promotionData[key] !== undefined && promotionData[key] !== null) {
        formData.append(key, promotionData[key].toString());
      }
    });
    
    // Agregar imágenes
    imageUris.forEach((uri, index) => {
      const filename = uri.split('/').pop() || `image${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('images', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type: type,
      });
    });
    
    return this.request('', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Actualizar promoción
  async updatePromotion(id, updates, imageUris = []) {
    const formData = new FormData();
    
    // Agregar campos de actualización
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && updates[key] !== null) {
        formData.append(key, updates[key].toString());
      }
    });
    
    // Agregar nuevas imágenes si hay
    imageUris.forEach((uri, index) => {
      const filename = uri.split('/').pop() || `image${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('images', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type: type,
      });
    });
    
    return this.request(`/${id}`, {
      method: 'PUT',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Eliminar promoción
  async deletePromotion(id) {
    return this.request(`/${id}`, {
      method: 'DELETE',
    });
  }

  // Buscar promociones
  async searchPromotions(query, filters = {}) {
    const params = new URLSearchParams({
      q: query,
      ...filters,
    });
    
    return this.request(`/search?${params.toString()}`);
  }

  // Obtener ofertas calientes
  async getHotOffers(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/hot?${params.toString()}`);
  }

  // Obtener promociones por categoría
  async getPromotionsByCategory(category, filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/category/${category}?${params.toString()}`);
  }
}

export default new PromotionsService();
```

### Uso en Componentes

```javascript
// components/PromotionList.js
import React, { useState, useEffect } from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import PromotionsService from '../services/PromotionsService';
import PromotionCard from './PromotionCard';

export default function PromotionList({ category, searchQuery }) {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, [category, searchQuery]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (searchQuery) {
        data = await PromotionsService.searchPromotions(searchQuery, { page, limit: 20 });
      } else if (category) {
        data = await PromotionsService.getPromotionsByCategory(category, { page, limit: 20 });
      } else {
        data = await PromotionsService.getAllPromotions({ page, limit: 20, status: 'active' });
      }

      if (data.success) {
        setPromotions(prev => page === 1 ? data.data.docs : [...prev, ...data.data.docs]);
        setHasMore(data.data.hasNextPage);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadPromotions();
    }
  };

  if (loading && promotions.length === 0) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <FlatList
      data={promotions}
      renderItem={({ item }) => <PromotionCard promotion={item} />}
      keyExtractor={item => item._id}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading ? <ActivityIndicator /> : null}
    />
  );
}
```

### Crear Promoción con Imágenes

```javascript
// screens/CreatePromotionScreen.js
import React, { useState } from 'react';
import { View, Button, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import PromotionsService from '../services/PromotionsService';

export default function CreatePromotionScreen() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      setImages(result.assets.map(asset => asset.uri));
    }
  };

  const createPromotion = async () => {
    if (images.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos una imagen');
      return;
    }

    try {
      setUploading(true);

      const promotionData = {
        title: 'iPhone 15 Pro',
        productName: 'iPhone 15 Pro',
        brand: 'Apple',
        category: 'electronics',
        originalPrice: 24999,
        currentPrice: 19999,
        currency: 'MXN',
        storeCity: 'Ciudad de México',
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        tags: 'smartphone,5G,Apple',
        isHotOffer: 'true',
        hotness: 'fire',
      };

      const result = await PromotionsService.createPromotion(promotionData, images);

      if (result.success) {
        Alert.alert('Éxito', 'Promoción creada exitosamente');
        // Navegar a la promoción creada
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View>
      <Button title="Seleccionar Imágenes" onPress={pickImages} />
      {images.map((uri, index) => (
        <Image key={index} source={{ uri }} style={{ width: 100, height: 100 }} />
      ))}
      <Button 
        title={uploading ? "Subiendo..." : "Crear Promoción"} 
        onPress={createPromotion}
        disabled={uploading}
      />
    </View>
  );
}
```

---

## 🎯 Flutter/Dart

### Servicio de Promociones

```dart
// lib/services/promotions_service.dart
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class PromotionsService {
  static const String baseUrl = 'http://localhost:3000/api/promotions';
  
  Future<Map<String, dynamic>> _request(
    String endpoint, {
    String method = 'GET',
    Map<String, dynamic>? body,
    List<File>? images,
  }) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    http.Request request;

    if (images != null || body != null) {
      // Multipart request para imágenes
      var multipartRequest = http.MultipartRequest(method, uri);
      
      // Agregar campos de texto
      if (body != null) {
        body.forEach((key, value) {
          multipartRequest.fields[key] = value.toString();
        });
      }
      
      // Agregar imágenes
      if (images != null) {
        for (var image in images) {
          multipartRequest.files.add(
            await http.MultipartFile.fromPath('images', image.path),
          );
        }
      }
      
      request = multipartRequest;
    } else {
      // Request normal
      request = http.Request(method, uri);
      if (body != null) {
        request.body = jsonEncode(body);
        request.headers['Content-Type'] = 'application/json';
      }
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Error en la solicitud');
    }
  }

  // Obtener todas las promociones
  Future<Map<String, dynamic>> getAllPromotions({
    int? page,
    int? limit,
    String? category,
    String? status,
    bool? isHotOffer,
    String? search,
  }) async {
    final queryParams = <String, String>{};
    if (page != null) queryParams['page'] = page.toString();
    if (limit != null) queryParams['limit'] = limit.toString();
    if (category != null) queryParams['category'] = category;
    if (status != null) queryParams['status'] = status;
    if (isHotOffer != null) queryParams['isHotOffer'] = isHotOffer.toString();
    if (search != null) queryParams['search'] = search;

    final queryString = queryParams.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
        .join('&');

    return _request(queryString.isNotEmpty ? '?$queryString' : '');
  }

  // Obtener promoción por ID
  Future<Map<String, dynamic>> getPromotionById(String id) {
    return _request('/$id');
  }

  // Obtener historial de precios
  Future<Map<String, dynamic>> getPriceHistory(String id) {
    return _request('/$id/history');
  }

  // Crear promoción
  Future<Map<String, dynamic>> createPromotion({
    required String title,
    required String productName,
    required String category,
    required double originalPrice,
    required double currentPrice,
    required List<File> images,
    Map<String, dynamic>? optionalFields,
  }) {
    final body = {
      'title': title,
      'productName': productName,
      'category': category,
      'originalPrice': originalPrice.toString(),
      'currentPrice': currentPrice.toString(),
      if (optionalFields != null) ...optionalFields,
    };

    return _request(
      '',
      method: 'POST',
      body: body,
      images: images,
    );
  }

  // Actualizar promoción
  Future<Map<String, dynamic>> updatePromotion(
    String id, {
    Map<String, dynamic>? updates,
    List<File>? images,
  }) {
    return _request(
      '/$id',
      method: 'PUT',
      body: updates,
      images: images,
    );
  }

  // Eliminar promoción
  Future<Map<String, dynamic>> deletePromotion(String id) {
    return _request('/$id', method: 'DELETE');
  }

  // Buscar promociones
  Future<Map<String, dynamic>> searchPromotions(
    String query, {
    int? page,
    int? limit,
  }) {
    final queryParams = {
      'q': query,
      if (page != null) 'page': page.toString(),
      if (limit != null) 'limit': limit.toString(),
    };

    final queryString = queryParams.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value.toString())}')
        .join('&');

    return _request('/search?$queryString');
  }

  // Obtener ofertas calientes
  Future<Map<String, dynamic>> getHotOffers({
    int? page,
    int? limit,
  }) {
    final queryParams = <String, String>{};
    if (page != null) queryParams['page'] = page.toString();
    if (limit != null) queryParams['limit'] = limit.toString();

    final queryString = queryParams.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
        .join('&');

    return _request('/hot${queryString.isNotEmpty ? '?$queryString' : ''}');
  }
}
```

### Uso en Widgets

```dart
// lib/widgets/promotion_list.dart
import 'package:flutter/material.dart';
import '../services/promotions_service.dart';

class PromotionList extends StatefulWidget {
  final String? category;
  final String? searchQuery;

  const PromotionList({Key? key, this.category, this.searchQuery}) : super(key: key);

  @override
  _PromotionListState createState() => _PromotionListState();
}

class _PromotionListState extends State<PromotionList> {
  final PromotionsService _service = PromotionsService();
  List<dynamic> _promotions = [];
  bool _loading = true;
  int _page = 1;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _loadPromotions();
  }

  Future<void> _loadPromotions() async {
    try {
      setState(() => _loading = true);

      Map<String, dynamic> data;
      if (widget.searchQuery != null) {
        data = await _service.searchPromotions(widget.searchQuery!, page: _page, limit: 20);
      } else if (widget.category != null) {
        data = await _service.getAllPromotions(
          category: widget.category,
          page: _page,
          limit: 20,
        );
      } else {
        data = await _service.getAllPromotions(
          status: 'active',
          page: _page,
          limit: 20,
        );
      }

      if (data['success'] == true) {
        setState(() {
          if (_page == 1) {
            _promotions = data['data']['docs'];
          } else {
            _promotions.addAll(data['data']['docs']);
          }
          _hasMore = data['data']['hasNextPage'] ?? false;
          _loading = false;
        });
      }
    } catch (e) {
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _promotions.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return ListView.builder(
      itemCount: _promotions.length + (_hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == _promotions.length) {
          _page++;
          _loadPromotions();
          return const Center(child: CircularProgressIndicator());
        }

        final promotion = _promotions[index];
        return PromotionCard(promotion: promotion);
      },
    );
  }
}
```

---

## 📝 Swift (iOS)

### Servicio de Promociones

```swift
// Services/PromotionsService.swift
import Foundation

class PromotionsService {
    static let shared = PromotionsService()
    private let baseURL = "http://localhost:3000/api/promotions"
    
    private init() {}
    
    // Obtener todas las promociones
    func getAllPromotions(
        page: Int = 1,
        limit: Int = 20,
        category: String? = nil,
        status: String? = nil,
        completion: @escaping (Result<[String: Any], Error>) -> Void
    ) {
        var components = URLComponents(string: baseURL)!
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        if let category = category {
            queryItems.append(URLQueryItem(name: "category", value: category))
        }
        if let status = status {
            queryItems.append(URLQueryItem(name: "status", value: status))
        }
        
        components.queryItems = queryItems
        
        guard let url = components.url else {
            completion(.failure(NSError(domain: "Invalid URL", code: -1)))
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                completion(.failure(NSError(domain: "Invalid response", code: -1)))
                return
            }
            
            completion(.success(json))
        }.resume()
    }
    
    // Crear promoción con imágenes
    func createPromotion(
        title: String,
        productName: String,
        category: String,
        originalPrice: Double,
        currentPrice: Double,
        images: [UIImage],
        optionalFields: [String: Any]? = nil,
        completion: @escaping (Result<[String: Any], Error>) -> Void
    ) {
        guard let url = URL(string: baseURL) else {
            completion(.failure(NSError(domain: "Invalid URL", code: -1)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        
        // Campos requeridos
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"title\"\r\n\r\n".data(using: .utf8)!)
        body.append(title.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"productName\"\r\n\r\n".data(using: .utf8)!)
        body.append(productName.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"category\"\r\n\r\n".data(using: .utf8)!)
        body.append(category.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"originalPrice\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(originalPrice)".data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"currentPrice\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(currentPrice)".data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        // Campos opcionales
        if let optionalFields = optionalFields {
            for (key, value) in optionalFields {
                body.append("--\(boundary)\r\n".data(using: .utf8)!)
                body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".data(using: .utf8)!)
                body.append("\(value)".data(using: .utf8)!)
                body.append("\r\n".data(using: .utf8)!)
            }
        }
        
        // Agregar imágenes
        for (index, image) in images.enumerated() {
            guard let imageData = image.jpegData(compressionQuality: 0.8) else { continue }
            
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"images\"; filename=\"image\(index).jpg\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
            body.append(imageData)
            body.append("\r\n".data(using: .utf8)!)
        }
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                completion(.failure(NSError(domain: "Invalid response", code: -1)))
                return
            }
            
            completion(.success(json))
        }.resume()
    }
}
```

---

## 🎯 Kotlin (Android)

### Servicio de Promociones

```kotlin
// PromotionsService.kt
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.File

class PromotionsService {
    private val baseURL = "http://localhost:3000/api/promotions"
    private val client = OkHttpClient()

    // Obtener todas las promociones
    fun getAllPromotions(
        page: Int = 1,
        limit: Int = 20,
        category: String? = null,
        status: String? = null,
        callback: (Result<JSONObject>) -> Unit
    ) {
        val urlBuilder = HttpUrl.parse(baseURL)?.newBuilder()
        urlBuilder?.addQueryParameter("page", page.toString())
        urlBuilder?.addQueryParameter("limit", limit.toString())
        category?.let { urlBuilder?.addQueryParameter("category", it) }
        status?.let { urlBuilder?.addQueryParameter("status", it) }

        val request = Request.Builder()
            .url(urlBuilder?.build()!!)
            .get()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(Result.failure(e))
            }

            override fun onResponse(call: Call, response: Response) {
                val body = response.body?.string()
                if (response.isSuccessful && body != null) {
                    callback(Result.success(JSONObject(body)))
                } else {
                    callback(Result.failure(Exception("Error: ${response.code}")))
                }
            }
        })
    }

    // Crear promoción con imágenes
    fun createPromotion(
        title: String,
        productName: String,
        category: String,
        originalPrice: Double,
        currentPrice: Double,
        imageFiles: List<File>,
        optionalFields: Map<String, String>? = null,
        callback: (Result<JSONObject>) -> Unit
    ) {
        val requestBody = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("title", title)
            .addFormDataPart("productName", productName)
            .addFormDataPart("category", category)
            .addFormDataPart("originalPrice", originalPrice.toString())
            .addFormDataPart("currentPrice", currentPrice.toString())
            .apply {
                optionalFields?.forEach { (key, value) ->
                    addFormDataPart(key, value)
                }
                imageFiles.forEachIndexed { index, file ->
                    val mediaType = "image/jpeg".toMediaType()
                    addFormDataPart(
                        "images",
                        "image$index.jpg",
                        file.asRequestBody(mediaType)
                    )
                }
            }
            .build()

        val request = Request.Builder()
            .url(baseURL)
            .post(requestBody)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(Result.failure(e))
            }

            override fun onResponse(call: Call, response: Response) {
                val body = response.body?.string()
                if (response.isSuccessful && body != null) {
                    callback(Result.success(JSONObject(body)))
                } else {
                    callback(Result.failure(Exception("Error: ${response.code}")))
                }
            }
        })
    }
}
```

---

## 🔧 Manejo de Errores y Retry

### React Native - Con Retry

```javascript
// utils/apiWithRetry.js
async function apiWithRetry(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

// Uso
const data = await apiWithRetry(
  () => PromotionsService.getAllPromotions({ page: 1, limit: 20 })
);
```

---

## 📊 Ejemplo Completo: Cargar y Mostrar Promociones

### React Native

```javascript
// screens/PromotionsScreen.js
import React, { useState, useEffect } from 'react';
import { View, FlatList, RefreshControl, Alert } from 'react-native';
import PromotionsService from '../services/PromotionsService';
import PromotionCard from '../components/PromotionCard';

export default function PromotionsScreen() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async (reset = false) => {
    try {
      if (reset) {
        setPage(1);
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const currentPage = reset ? 1 : page;
      const response = await PromotionsService.getAllPromotions({
        page: currentPage,
        limit: 20,
        status: 'active',
      });

      if (response.success) {
        const newPromotions = response.data.docs;
        
        setPromotions(prev => 
          reset ? newPromotions : [...prev, ...newPromotions]
        );
        setHasMore(response.data.hasNextPage);
        setPage(currentPage + 1);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadPromotions(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPromotions();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={promotions}
        renderItem={({ item }) => (
          <PromotionCard 
            promotion={item}
            onPress={() => navigation.navigate('PromotionDetails', { id: item._id })}
          />
        )}
        keyExtractor={item => item._id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        ListFooterComponent={
          loading && promotions.length > 0 ? <ActivityIndicator /> : null
        }
      />
    </View>
  );
}
```

---

## 🎨 Ejemplo: Mostrar Imagen Optimizada

```javascript
// components/OptimizedImage.js
import React from 'react';
import { Image } from 'react-native';

export default function OptimizedImage({ promotion, index = 0 }) {
  const image = promotion.images?.[index];
  
  // Priorizar Cloudinary, luego URL local, luego placeholder
  const imageUrl = image?.cloudinaryUrl 
    || (image?.url ? `http://localhost:3000${image.url}` : null)
    || 'https://via.placeholder.com/400x300';

  return (
    <Image
      source={{ uri: imageUrl }}
      style={{ width: '100%', height: 200 }}
      resizeMode="cover"
    />
  );
}
```

---

## 📝 Notas Finales

1. **URLs de Imágenes**: Las imágenes se sirven desde `/uploads/{filename}` en desarrollo
2. **Optimización**: Las imágenes se optimizan automáticamente (40-70% reducción)
3. **Rate Limiting**: Respeta los límites de rate limiting
4. **Manejo de Errores**: Siempre maneja errores y muestra mensajes al usuario
5. **Loading States**: Muestra estados de carga para mejor UX
6. **Paginación**: Implementa paginación infinita para mejor rendimiento

---

**Última actualización:** 2024-01-22
