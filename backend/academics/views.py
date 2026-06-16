from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Course, Application, Registration, Result
from .serializers import CourseSerializer, ApplicationSerializer, RegistrationSerializer, ResultSerializer
from accounts.models import User

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'level', 'semester', 'session', 'is_elective']
    search_fields = ['code', 'title']
    ordering_fields = ['code', 'title', 'level']
    ordering = ['code']

class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'application_level', 'department']
    search_fields = ['user__username', 'user__email']
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'role') and user.role == 'admin':
            return Application.objects.all()
        return Application.objects.filter(user=user)

class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.all()
    serializer_class = RegistrationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['level', 'semester', 'session']
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'role') and user.role == 'admin':
            return Registration.objects.all()
        return Registration.objects.filter(user=user)

class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.all()
    serializer_class = ResultSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['course__level']
    search_fields = ['course__code', 'course__title', 'user__username']
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'role') and (user.role == 'admin' or user.role == 'staff'):
            return Result.objects.all()
        return Result.objects.filter(user=user)


class ResultCheckerViewSet(viewsets.ViewSet):
    """
    Check examination results using examination number.
    Allows unauthenticated access for result checking.
    """
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'], url_path='check-by-exam-number')
    def check_by_exam_number(self, request):
        """
        Check results by examination number.
        POST payload: { "examination_number": "EXM2024001", "password": "studentpassword" }
        """
        examination_number = request.data.get('examination_number', '').strip()
        password = request.data.get('password', '')

        if not examination_number:
            return Response(
                {'error': 'Examination number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Try to find user by examination number
            user = User.objects.get(examination_number=examination_number)
            
            # Verify password
            if not user.check_password(password):
                return Response(
                    {'error': 'Invalid password'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Get all results for this user
            results = Result.objects.filter(user=user).order_by('-session', '-semester', 'course__code')
            
            # Calculate statistics
            total_courses = results.count()
            if total_courses == 0:
                return Response(
                    {
                        'error': 'No examination results found',
                        'examination_number': examination_number
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            total_points = sum([r.grade_points * r.course.unit for r in results])
            total_units = sum([r.course.unit for r in results])
            gpa = total_points / total_units if total_units > 0 else 0.0

            # Serialize results
            results_data = ResultSerializer(results, many=True).data
            
            # Group results by session
            results_by_session = {}
            for result_data in results_data:
                session = result_data.get('session')
                if session not in results_by_session:
                    results_by_session[session] = []
                results_by_session[session].append(result_data)

            return Response({
                'success': True,
                'examination_number': examination_number,
                'student_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'matriculation_number': user.matricNo,
                'email': user.email,
                'total_courses': total_courses,
                'total_units': total_units,
                'gpa': round(gpa, 2),
                'results_by_session': results_by_session,
                'all_results': results_data,
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response(
                {'error': 'Examination number not found in the system'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
