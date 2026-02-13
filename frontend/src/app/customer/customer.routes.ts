import { Routes } from '@angular/router';
import { CustomerLayoutComponent } from './layout/customer-layout.component';
import { HomeComponent } from './home/home.component';
import { SearchComponent } from './search/search.component';
import { ActivityComponent } from './activity/activity.component';
import { ProfileComponent } from './profile/profile.component';
import { VendorDetailComponent } from './vendor-detail/vendor-detail.component';
import { BookingFormComponent } from './booking-form/booking-form.component';
import { BookingDetailComponent } from './booking-detail/booking-detail.component';
import { ChatComponent } from './chat/chat.component';
import { AddressManagementComponent } from './address-management/address-management.component';
import { NotificationsComponent } from './notifications/notifications.component';

export const CUSTOMER_ROUTES: Routes = [
    {
        path: '',
        component: CustomerLayoutComponent,
        children: [
            { path: '', component: HomeComponent },
            { path: 'search', component: SearchComponent },
            { path: 'activity', component: ActivityComponent },
            { path: 'profile', component: ProfileComponent },
            { path: 'notifications', component: NotificationsComponent },
            { path: 'vendor/:id', component: VendorDetailComponent },
            { path: 'book/:vendorId/:serviceId', component: BookingFormComponent },
            { path: 'booking/:id', component: BookingDetailComponent },
            { path: 'chat/:bookingId', component: ChatComponent },
            { path: 'addresses', component: AddressManagementComponent },
        ],
    },
];
