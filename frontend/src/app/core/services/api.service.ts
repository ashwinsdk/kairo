import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    // Vendors
    getVendors(params?: any): Observable<any> {
        return this.http.get(`${this.baseUrl}/vendors`, { params, withCredentials: true });
    }
    getCategories(): Observable<any> {
        return this.http.get(`${this.baseUrl}/vendors/categories`, { withCredentials: true });
    }
    getPromotedVendors(): Observable<any> {
        return this.http.get(`${this.baseUrl}/vendors/promoted`, { withCredentials: true });
    }
    getVendor(id: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/vendors/${id}`, { withCredentials: true });
    }
    getVendorDetail(id: number | string): Observable<any> {
        return this.http.get(`${this.baseUrl}/vendors/${id}`, { withCredentials: true });
    }

    // Profile
    getProfile(): Observable<any> {
        return this.http.get(`${this.baseUrl}/profile`, { withCredentials: true });
    }
    updateProfile(data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/profile`, data, { withCredentials: true });
    }
    updateLocation(lat: number, lng: number): Observable<any> {
        return this.http.patch(`${this.baseUrl}/profile/location`, { lat, lng }, { withCredentials: true });
    }
    updateVendorProfile(data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/profile/vendor`, data, { withCredentials: true });
    }
    uploadDocument(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/profile/vendor/documents`, data, { withCredentials: true });
    }
    addVendorService(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/profile/vendor/services`, data, { withCredentials: true });
    }
    getVendorServices(): Observable<any> {
        return this.http.get(`${this.baseUrl}/profile/vendor/services`, { withCredentials: true });
    }
    updateVendorService(id: number | string, data: any): Observable<any> {
        return this.http.patch(`${this.baseUrl}/profile/vendor/services/${id}`, data, { withCredentials: true });
    }

    // Addresses
    getAddresses(): Observable<any> {
        return this.http.get(`${this.baseUrl}/profile/addresses`, { withCredentials: true });
    }
    createAddress(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/profile/addresses`, data, { withCredentials: true });
    }
    updateAddress(id: number | string, data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/profile/addresses/${id}`, data, { withCredentials: true });
    }
    deleteAddress(id: number | string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/profile/addresses/${id}`, { withCredentials: true });
    }

    // Bookings
    createBooking(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/bookings`, data, { withCredentials: true });
    }
    getBookings(params?: any): Observable<any> {
        return this.http.get(`${this.baseUrl}/bookings`, { params, withCredentials: true });
    }
    getBooking(id: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/bookings/${id}`, { withCredentials: true });
    }
    getBookingDetail(id: number | string): Observable<any> {
        return this.http.get(`${this.baseUrl}/bookings/${id}`, { withCredentials: true });
    }
    updateBookingStatus(id: number | string, data: any): Observable<any> {
        return this.http.patch(`${this.baseUrl}/bookings/${id}/status`, data, { withCredentials: true });
    }
    verifyJobOtp(id: number | string, otp: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/bookings/${id}/verify-otp`, { otp }, { withCredentials: true });
    }
    updateBookingPrice(id: number | string, data: any): Observable<any> {
        return this.http.patch(`${this.baseUrl}/bookings/${id}/price`, data, { withCredentials: true });
    }
    rateBooking(id: number | string, data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/bookings/${id}/rate`, data, { withCredentials: true });
    }

    // Chat
    getChat(bookingId: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/chat/${bookingId}`, { withCredentials: true });
    }
    getChatMessages(bookingId: number | string): Observable<any> {
        return this.http.get(`${this.baseUrl}/chat/${bookingId}`, { withCredentials: true });
    }
    sendMessage(bookingId: string, content: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/chat/${bookingId}/messages`, { content }, { withCredentials: true });
    }
    sendChatMessage(bookingId: number | string, content: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/chat/${bookingId}/messages`, { content }, { withCredentials: true });
    }
    pollMessages(bookingId: string, since: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/chat/${bookingId}/poll`, { params: { since }, withCredentials: true });
    }
    pollChatMessages(bookingId: number | string, since: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/chat/${bookingId}/poll`, { params: { since }, withCredentials: true });
    }

    // Payments
    processPayment(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/payments`, data, { withCredentials: true });
    }
    confirmPayment(id: string): Observable<any> {
        return this.http.patch(`${this.baseUrl}/payments/${id}/confirm`, {}, { withCredentials: true });
    }
    getPaymentHistory(params?: any): Observable<any> {
        return this.http.get(`${this.baseUrl}/payments/history`, { params, withCredentials: true });
    }

    // Earnings
    getEarnings(): Observable<any> {
        return this.http.get(`${this.baseUrl}/earnings`, { withCredentials: true });
    }

    // Notifications
    getNotifications(params?: any): Observable<any> {
        return this.http.get(`${this.baseUrl}/notifications`, { params, withCredentials: true });
    }
    markNotificationRead(id: string): Observable<any> {
        return this.http.patch(`${this.baseUrl}/notifications/${id}/read`, {}, { withCredentials: true });
    }
    markAllNotificationsRead(): Observable<any> {
        return this.http.patch(`${this.baseUrl}/notifications/read-all`, {}, { withCredentials: true });
    }

    // Admin
    getAdminDashboard(): Observable<any> {
        return this.http.get(`${this.baseUrl}/admin/dashboard`, { withCredentials: true });
    }
    getKycList(params?: any): Observable<any> {
        return this.http.get(`${this.baseUrl}/admin/kyc`, { params, withCredentials: true });
    }
    updateKyc(vendorId: number | string, data: any): Observable<any> {
        return this.http.patch(`${this.baseUrl}/admin/kyc/${vendorId}`, data, { withCredentials: true });
    }
    getUsers(params?: any): Observable<any> {
        return this.http.get(`${this.baseUrl}/admin/users`, { params, withCredentials: true });
    }
    blockUser(id: number | string, blocked: boolean): Observable<any> {
        return this.http.patch(`${this.baseUrl}/admin/users/${id}/block`, { blocked }, { withCredentials: true });
    }
    getMaintenanceStatus(): Observable<any> {
        return this.http.get(`${this.baseUrl}/admin/maintenance`, { withCredentials: true });
    }
    toggleMaintenance(enabled: boolean): Observable<any> {
        return this.http.patch(`${this.baseUrl}/admin/maintenance`, { enabled }, { withCredentials: true });
    }
    getAdminActions(params?: any): Observable<any> {
        return this.http.get(`${this.baseUrl}/admin/actions`, { params, withCredentials: true });
    }

    // Geocoding
    reverseGeocode(lat: number, lng: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/vendors/geocode/reverse`, { params: { lat, lng }, withCredentials: true });
    }
}
